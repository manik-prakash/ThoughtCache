from google import genai

from app.config import get_settings

NO_CONTEXT_MESSAGE = "I don't have any saved items relevant to that question yet."


def build_prompt(question: str, context_blocks: list[tuple[int, str, str]]) -> str:
    context_section = "\n\n".join(
        f'[{i}] (from "{title}")\n{text}' for i, title, text in context_blocks
    )
    return (
        "You are answering a question using ONLY the numbered context excerpts "
        "below, which come from the user's personal notes. Cite sources inline "
        "using [n] matching the excerpt numbers. If the context does not contain "
        "enough information to answer, say so plainly instead of guessing.\n\n"
        f"Context:\n{context_section}\n\n"
        f"Question: {question}\n\nAnswer:"
    )


def generate_answer(prompt: str) -> str:
    settings = get_settings()
    client = genai.Client(api_key=settings.GEMINI_API_KEY)
    response = client.models.generate_content(
        model=settings.GEMINI_MODEL,
        contents=prompt,
    )
    return response.text
