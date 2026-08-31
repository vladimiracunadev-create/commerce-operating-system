import os, json
from fastapi import FastAPI
from pydantic import BaseModel
import httpx

app = FastAPI(title="Commerce OS Agents")

class AgentInput(BaseModel):
    goal: str = ""
    context: dict = {}

SYSTEMS = {
    "brand": "Eres un agente de imagen corporativa. Propón identidad, tono, mensajes y activos; nunca publiques sin aprobación.",
    "catalog": "Eres un agente de catálogo. Normaliza fichas, categorías, atributos, SEO y calidad de datos; entrega cambios propuestos.",
    "crm": "Eres un agente CRM. Segmenta clientes y sugiere acciones respetando consentimiento, privacidad y minimización de datos.",
    "partnerships": "Eres un agente B2B. Detecta oportunidades de integración/proveedores/alianzas y propone próximos pasos auditables.",
    "marketing": "Eres un agente de marketing. Diseña campañas, audiencias, contenidos, métricas y experimentos; no publiques sin aprobación."
}

async def llm(system: str, inp: AgentInput):
    base = os.getenv("LLM_BASE_URL", "").rstrip("/")
    key = os.getenv("LLM_API_KEY", "")
    model = os.getenv("LLM_MODEL", "")
    if not (base and key and model):
        return None
    payload = {"model":model,"messages":[{"role":"system","content":system},{"role":"user","content":json.dumps(inp.model_dump(),ensure_ascii=False)}],"temperature":0.2}
    async with httpx.AsyncClient(timeout=40) as client:
        r = await client.post(f"{base}/chat/completions",headers={"Authorization":f"Bearer {key}","Content-Type":"application/json"},json=payload)
        r.raise_for_status()
        return r.json()["choices"][0]["message"]["content"]

def fallback(name: str, inp: AgentInput):
    templates = {
      "brand": ["Definir propuesta de valor y personalidad de marca", "Crear guía de tono y mensajes", "Generar backlog de piezas visuales para aprobación"],
      "catalog": ["Validar SKU, nombre, precio, categoría y atributos", "Detectar campos faltantes o inconsistentes", "Proponer descripción comercial y SEO"],
      "crm": ["Segmentar por recencia, frecuencia y valor", "Excluir clientes sin consentimiento de marketing", "Proponer campaña o tarea comercial por segmento"],
      "partnerships": ["Identificar tipo de socio/proveedor/API requerido", "Evaluar beneficio, riesgo y datos compartidos", "Preparar propuesta de integración y checklist contractual"],
      "marketing": ["Definir objetivo y KPI", "Seleccionar audiencia y canal", "Proponer 3 creatividades y un experimento A/B"]
    }
    return {"mode":"safe-fallback","agent":name,"goal":inp.goal,"proposal":templates[name],"requires_human_approval":True,"write_actions_executed":False}

@app.get('/health')
def health(): return {"ok":True}

@app.post('/agents/{name}')
async def run_agent(name: str, inp: AgentInput):
    if name not in SYSTEMS:
        return {"error":"agent_not_found"}
    generated = await llm(SYSTEMS[name], inp)
    if generated:
        return {"mode":"llm","agent":name,"proposal":generated,"requires_human_approval":True,"write_actions_executed":False}
    return fallback(name, inp)
