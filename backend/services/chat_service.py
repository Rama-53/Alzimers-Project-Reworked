"""Chatbot service using Ollama REST API.

Connects to a local Ollama instance running Llama 3.1 (or any configured model).
Builds compassionate, memory-aiding system prompts with injected patient context.
"""
import requests

from config import OLLAMA_BASE_URL, OLLAMA_MODEL


class ChatService:
    """Manages communication with the Ollama LLM for context-aware chat."""

    def __init__(self):
        self.base_url = OLLAMA_BASE_URL
        self.model = OLLAMA_MODEL

    # ---- Health Check ----

    def is_available(self) -> dict:
        """Check if Ollama is running and the target model is pulled.

        Returns:
            Dict with ollama_running, model_available, model_name, available_models
        """
        try:
            resp = requests.get(f"{self.base_url}/api/tags", timeout=5)
            if resp.status_code == 200:
                models = resp.json().get("models", [])
                model_names = [m["name"] for m in models]
                model_available = any(self.model in name for name in model_names)
                return {
                    "ollama_running": True,
                    "model_available": model_available,
                    "model_name": self.model,
                    "available_models": model_names,
                }
            return {
                "ollama_running": False,
                "model_available": False,
                "model_name": self.model,
                "available_models": [],
            }
        except requests.exceptions.ConnectionError:
            return {
                "ollama_running": False,
                "model_available": False,
                "model_name": self.model,
                "available_models": [],
                "error": "Cannot connect to Ollama. Is it running?",
            }
        except Exception as e:
            return {
                "ollama_running": False,
                "model_available": False,
                "model_name": self.model,
                "available_models": [],
                "error": str(e),
            }

    # ---- Chat ----

    def chat(
        self,
        user_message: str,
        context: str = "",
        conversation_history: list[dict] | None = None,
        auto_greet_person: str | None = None,
    ) -> str:
        """Send a message to the chatbot with patient context.

        Args:
            user_message: The patient's or caregiver's message
            context: Formatted context string (from ContextService)
            conversation_history: Previous messages [{"role": "user"|"assistant", "content": "..."}]
            auto_greet_person: If set, the chatbot generates an auto-greet for this person name

        Returns:
            The chatbot's response text
        """
        system_prompt = self._build_system_prompt(context)

        messages = [{"role": "system", "content": system_prompt}]

        # Include conversation history (keep last 10 exchanges to manage context window)
        if conversation_history:
            messages.extend(conversation_history[-20:])

        # If auto-greeting, modify the user message
        if auto_greet_person:
            user_message = (
                f"A person has just been recognized by the camera. "
                f"Their name is {auto_greet_person}. "
                f"Please greet the patient warmly and tell them who this person is, "
                f"using the context provided about this person."
            )

        messages.append({"role": "user", "content": user_message})

        try:
            response = requests.post(
                f"{self.base_url}/api/chat",
                json={
                    "model": self.model,
                    "messages": messages,
                    "stream": False,
                    "options": {
                        "temperature": 0.7,
                        "num_predict": 500,
                    },
                },
                timeout=60,
            )

            if response.status_code == 200:
                content = (
                    response.json()
                    .get("message", {})
                    .get("content", "I'm sorry, I couldn't process that right now.")
                )
                return content
            else:
                return (
                    f"⚠️ I'm having trouble thinking right now. "
                    f"(Ollama returned status {response.status_code})"
                )

        except requests.exceptions.ConnectionError:
            return (
                "⚠️ I can't connect to my brain right now. "
                "Please make sure Ollama is running "
                "(run `ollama serve` in a terminal or start the Docker container)."
            )
        except requests.exceptions.Timeout:
            return (
                "⚠️ I'm taking too long to think. "
                "Please try asking again with a shorter question."
            )
        except Exception as e:
            return f"⚠️ Something went wrong: {str(e)}"

    # ---- Prompt Engineering ----

    def _build_system_prompt(self, context: str) -> str:
        """Build the system prompt that defines the chatbot's personality and injects context."""
        context_section = ""
        if context:
            context_section = (
                "\n\n"
                "=== KNOWN PEOPLE AND RECENT INTERACTIONS ===\n"
                f"{context}\n"
                "=== END OF CONTEXT ==="
            )

        return f"""You are a warm, compassionate, and patient memory assistant for a person with Alzheimer's disease.
Your name is "Helper" and you speak in a gentle, reassuring tone.

YOUR ROLE:
- Help the patient remember people, events, and conversations
- Provide information about visitors based on the context data below
- Be warm, encouraging, and never make the patient feel bad about forgetting
- Keep responses concise (2-4 sentences) unless asked for more detail

IMPORTANT RULES:
1. ONLY use information from the context provided below — NEVER make up or guess facts
2. If you don't have information about something, say so gently: "I don't have that information right now, but that's okay!"
3. Use simple, clear language — avoid medical jargon
4. When describing a person, always mention their name, relationship, and when they were last seen
5. If the patient seems confused or distressed, be extra gentle and reassuring
6. Always refer to people by their first name to feel personal and warm
7. If asked "who is this?" or "who visited?", check the context for currently present or recently seen people

EXAMPLE RESPONSES:
- "That's Rahul, your son! 😊 He was here just yesterday and you talked about his new job."
- "Today you've had two visitors — Priya, your daughter, came this morning, and your nurse Anita visited in the afternoon."
- "I don't have that information right now, but we can ask your caregiver to help us find out!"{context_section}"""


# Singleton — reuse across requests
chat_service = ChatService()
