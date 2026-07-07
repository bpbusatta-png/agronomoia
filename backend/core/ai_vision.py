import json
import re
from typing import Optional, TypedDict

from google import genai
from google.genai import types

from core.config import settings

TIPOS_VALIDOS = {"praga", "doenca", "planta_daninha", "planta_atipica", "indeterminado"}

_SYSTEM_PROMPT = """Você é um agrônomo especialista analisando fotos de lavouras (principalmente soja) \
para triagem fitossanitária inicial. Dada uma foto, identifique se ela mostra:
- "praga": um inseto ou outro artrópode causando dano à cultura
- "doenca": sintoma de doença fúngica, bacteriana ou viral na planta
- "planta_daninha": uma erva invasora competindo com a cultura plantada
- "planta_atipica": uma planta da própria cultura com característica fora do padrão \
esperado (cor de flor, arquitetura, pubescência, formato de folha/vagem, etc.) — \
NÃO confundir com planta daninha, que é uma espécie diferente da cultura.
- "indeterminado": a foto não permite identificação confiável (borrada, sem foco no problema, etc.)

Responda ESTRITAMENTE em JSON, sem nenhum texto antes ou depois, neste formato exato:
{"tipo_identificado": "praga|doenca|planta_daninha|planta_atipica|indeterminado", \
"nome_sugerido": "string ou null", "confianca": 0.0, "observacoes": "string"}

"confianca" é um número entre 0 e 1. Seja conservador: se não tiver certeza razoável, \
prefira "indeterminado" com confiança baixa a arriscar um palpite."""


class AIVisionNotConfigured(Exception):
    pass


class ClassificacaoIA(TypedDict):
    tipo_identificado: str
    nome_sugerido: Optional[str]
    confianca: float
    observacoes: str


def _extrair_json(texto: str) -> dict:
    try:
        return json.loads(texto)
    except json.JSONDecodeError:
        match = re.search(r"\{.*\}", texto, re.DOTALL)
        if match:
            return json.loads(match.group(0))
        raise


def classificar_imagem(
    image_bytes: bytes, content_type: str, tipo_esperado: Optional[str] = None
) -> ClassificacaoIA:
    if not settings.gemini_api_key:
        raise AIVisionNotConfigured("GEMINI_API_KEY não configurada")

    client = genai.Client(api_key=settings.gemini_api_key)

    prompt = "Analise esta foto de lavoura e classifique-a conforme instruído."
    if tipo_esperado:
        prompt += f' O usuário indicou que espera encontrar: "{tipo_esperado}".'

    response = client.models.generate_content(
        model=settings.gemini_vision_model,
        contents=[
            types.Part.from_bytes(data=image_bytes, mime_type=content_type),
            prompt,
        ],
        config=types.GenerateContentConfig(
            system_instruction=_SYSTEM_PROMPT,
            response_mime_type="application/json",
            max_output_tokens=512,
        ),
    )

    texto_resposta = response.text or ""

    try:
        dados = _extrair_json(texto_resposta)
        tipo = dados.get("tipo_identificado")
        if tipo not in TIPOS_VALIDOS:
            tipo = "indeterminado"
        confianca = float(dados.get("confianca") or 0)
        confianca = max(0.0, min(1.0, confianca))
        return ClassificacaoIA(
            tipo_identificado=tipo,
            nome_sugerido=dados.get("nome_sugerido"),
            confianca=confianca,
            observacoes=str(dados.get("observacoes") or ""),
        )
    except (json.JSONDecodeError, ValueError, AttributeError):
        return ClassificacaoIA(
            tipo_identificado="indeterminado",
            nome_sugerido=None,
            confianca=0.0,
            observacoes=f"Resposta do modelo não pôde ser interpretada: {texto_resposta[:500]}",
        )
