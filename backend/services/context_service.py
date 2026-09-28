"""Context builder service for recognition results and chatbot prompts.

Pulls people + interaction data from MongoDB and formats it into
human-readable context for display in the UI and for the LLM chatbot.
"""
from datetime import datetime

from database import get_db


class ContextService:
    """Builds context from MongoDB data for recognition results and chatbot."""

    async def get_recognition_context(self, patient_id: str, person_id: str) -> dict:
        """Get full context for a recognized person.

        Returns a dict with person info, last-seen details, total visit count,
        and the 5 most recent interactions.
        """
        db = get_db()
        from bson import ObjectId

        # Fetch person details
        person = await db.people.find_one(
            {"_id": ObjectId(person_id), "patient_id": patient_id}
        )
        if not person:
            return {}

        # Fetch last interaction
        last_interaction = await db.interactions.find_one(
            {"patient_id": patient_id, "person_id": person_id},
            sort=[("timestamp", -1)],
        )

        # Total interaction count
        total_visits = await db.interactions.count_documents(
            {"patient_id": patient_id, "person_id": person_id}
        )

        # Recent interactions (up to 5)
        cursor = db.interactions.find(
            {"patient_id": patient_id, "person_id": person_id}
        ).sort("timestamp", -1).limit(5)

        recent_interactions = []
        async for doc in cursor:
            ts = doc.get("timestamp")
            recent_interactions.append({
                "timestamp": ts.isoformat() if isinstance(ts, datetime) else str(ts),
                "time_ago": self._time_ago(ts),
                "location": doc.get("location", ""),
                "topics": doc.get("conversation_topics", []),
                "notes": doc.get("notes", ""),
            })

        # Build context dict
        context = {
            "person": {
                "id": str(person["_id"]),
                "name": person["name"],
                "relationship": person["relationship"],
                "notes": person.get("notes", ""),
                "photo_count": len(person.get("photos", [])),
                "audio_count": len(person.get("audio_notes", [])),
            },
            "last_seen": None,
            "total_visits": total_visits,
            "recent_interactions": recent_interactions,
        }

        if last_interaction:
            ts = last_interaction["timestamp"]
            context["last_seen"] = {
                "timestamp": ts.isoformat() if isinstance(ts, datetime) else str(ts),
                "time_ago": self._time_ago(ts),
                "location": last_interaction.get("location", ""),
                "topics": last_interaction.get("conversation_topics", []),
                "notes": last_interaction.get("notes", ""),
            }

        return context

    async def build_chatbot_context(self, patient_id: str, session_person_ids: list[str] = None) -> str:
        """Build a comprehensive context string for the chatbot LLM.

        Includes all known people for the patient plus their recent interactions.
        Optionally highlights people recognized in the current session.

        Args:
            patient_id: The patient's ID
            session_person_ids: List of person IDs recognized in the current session

        Returns:
            A formatted context string to inject into the LLM system prompt
        """
        db = get_db()

        # Fetch all known people for this patient
        cursor = db.people.find({"patient_id": patient_id})
        people = []
        async for doc in cursor:
            people.append(doc)

        if not people:
            return "No known people registered for this patient yet."

        # Fetch all interactions (last 50)
        int_cursor = db.interactions.find(
            {"patient_id": patient_id}
        ).sort("timestamp", -1).limit(50)

        interactions = []
        async for doc in int_cursor:
            interactions.append(doc)

        # Build context
        parts = []

        # Currently recognized people (session context)
        if session_person_ids:
            session_names = []
            for person in people:
                if str(person["_id"]) in session_person_ids:
                    session_names.append(f"{person['name']} ({person['relationship']})")
            if session_names:
                parts.append(f"🟢 CURRENTLY PRESENT: {', '.join(session_names)}")
                parts.append("")

        # Each person's profile + recent interactions
        for person in people:
            pid = str(person["_id"])
            is_present = pid in (session_person_ids or [])
            marker = " [CURRENTLY PRESENT]" if is_present else ""

            section = f"--- {person['name']} ({person['relationship']}){marker} ---"
            if person.get("notes"):
                section += f"\nAbout: {person['notes']}"

            # Person's interactions
            person_ints = [i for i in interactions if i.get("person_id") == pid]
            if person_ints:
                latest = person_ints[0]
                ts = latest.get("timestamp")
                section += f"\nLast seen: {self._time_ago(ts)}"
                if latest.get("location"):
                    section += f" at {latest['location']}"
                if latest.get("conversation_topics"):
                    section += f"\nLast topics: {', '.join(latest['conversation_topics'])}"
                if latest.get("notes") and latest["notes"] != "Auto-logged from face recognition":
                    section += f"\nLast notes: {latest['notes']}"
                section += f"\nTotal visits: {len(person_ints)}"

                if len(person_ints) > 1:
                    section += "\nRecent visits:"
                    for interaction in person_ints[:3]:
                        its = interaction.get("timestamp")
                        loc = interaction.get("location", "")
                        section += f"\n  • {self._time_ago(its)}"
                        if loc:
                            section += f" at {loc}"
                        if interaction.get("conversation_topics"):
                            section += f" — {', '.join(interaction['conversation_topics'])}"
            else:
                section += "\nNo visits recorded yet."

            parts.append(section)

        # Today's summary
        today_start = datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0)
        today_ints = [i for i in interactions if i.get("timestamp") and i["timestamp"] >= today_start]
        if today_ints:
            unique_today = set(i.get("person_name", "Unknown") for i in today_ints)
            parts.append(f"\n--- Today's Summary ---")
            parts.append(f"Visitors today: {', '.join(unique_today)} ({len(today_ints)} total visits)")

        return "\n".join(parts)

    def _time_ago(self, dt) -> str:
        """Convert a datetime to a human-readable relative time string."""
        if dt is None:
            return "unknown"
        if isinstance(dt, str):
            try:
                dt = datetime.fromisoformat(dt)
            except ValueError:
                return dt

        now = datetime.utcnow()
        diff = now - dt

        if diff.days == 0:
            hours = diff.seconds // 3600
            if hours == 0:
                minutes = diff.seconds // 60
                if minutes <= 0:
                    return "just now"
                return f"{minutes} minute{'s' if minutes != 1 else ''} ago"
            return f"{hours} hour{'s' if hours != 1 else ''} ago"
        elif diff.days == 1:
            return "yesterday"
        elif diff.days < 7:
            return f"{diff.days} days ago"
        elif diff.days < 30:
            weeks = diff.days // 7
            return f"{weeks} week{'s' if weeks != 1 else ''} ago"
        else:
            return dt.strftime("%B %d, %Y")


# Singleton
context_service = ContextService()
