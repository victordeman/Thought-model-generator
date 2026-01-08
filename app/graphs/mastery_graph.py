from typing import TypedDict, Annotated, Dict, Any, Literal
from langgraph.graph import StateGraph, START, END
from langgraph.graph.message import add_messages
from langchain_core.prompts import PromptTemplate
from langchain_core.output_parsers import JsonOutputParser, StrOutputParser
from langchain_community.vectorstores import FAISS
from langchain_openai import OpenAIEmbeddings
from langsmith import traceable
from app.config import settings
from app.services.llm_service import get_llm

class MasteryState(TypedDict):
    code: str
    inversion_risks: Annotated[list[str], add_messages]
    principles_mastery: Dict[str, float]
    recommendations: Annotated[list[str], add_messages]
    confidence_score: float
    chat_history: Annotated[list[Any], add_messages]
    loop_count: int

@traceable(metadata={"step": "invert", "app": "thought-model-generator"})
def invert_node(state: MasteryState) -> Dict[str, Any]:
    llm = get_llm()
    invert_prompt = PromptTemplate.from_template(
        "List exactly 8-12 specific OOP anti-patterns in this code:\n{code}\nOutput as bulleted list."
    )
    chain = invert_prompt | llm | StrOutputParser()
    risks = chain.invoke({"code": state["code"]})
    return {"inversion_risks": risks.split("\n")}

@traceable(metadata={"step": "principles", "app": "thought-model-generator"})
def principles_node(state: MasteryState) -> Dict[str, Any]:
    llm = get_llm()
    principles_prompt = PromptTemplate.from_template(
        "Score OOP principles (0.0-1.0) with reasons:\n{code}\nJSON: {{'encapsulation': {{'score': float}}, ...}}"
    )
    chain = principles_prompt | llm | JsonOutputParser()
    raw_mastery = chain.invoke({"code": state["code"]})
    mastery = {k: v['score'] for k, v in raw_mastery.items()}
    return {"principles_mastery": mastery}

@traceable(metadata={"step": "rebuild", "app": "thought-model-generator"})
def rebuild_node(state: MasteryState) -> Dict[str, Any]:
    llm = get_llm()
    # RAG setup
    embeddings = OpenAIEmbeddings(api_key=settings.openai_api_key)
    baseline_texts = ["Encapsulation best practices...", "Abstraction examples..."]  # Expand in prod
    vectorstore = FAISS.from_texts(baseline_texts, embeddings)
    retrieved = vectorstore.similarity_search(state["code"], k=3)
    retrieved_gaps = "\n".join([doc.page_content for doc in retrieved])

    rebuild_prompt = PromptTemplate.from_template(
        "History: {chat_history}\nRisks: {inversion_risks}\nMastery: {principles_mastery}\nGaps: {retrieved_gaps}\nCode: {code}\n"
        "Generate 5 recommendations and confidence score (0.0-1.0). JSON: {{'recommendations': list, 'confidence_score': float}}"
    )
    chain = rebuild_prompt | llm | JsonOutputParser()
    output = chain.invoke({
        "chat_history": state["chat_history"],
        "inversion_risks": state["inversion_risks"],
        "principles_mastery": state["principles_mastery"],
        "retrieved_gaps": retrieved_gaps,
        "code": state["code"]
    })
    return {
        "recommendations": output["recommendations"],
        "confidence_score": output["confidence_score"]
    }

@traceable(metadata={"step": "reflect", "app": "thought-model-generator"})
def reflect_node(state: MasteryState) -> Dict[str, Any]:
    llm = get_llm()
    reflect_prompt = PromptTemplate.from_template(
        "Reflect on low confidence: {confidence_score}. Notes: {notes}\nSuggest improvements.\nAdd to history."
    )
    chain = reflect_prompt | llm | StrOutputParser()
    reflection = chain.invoke({
        "confidence_score": state["confidence_score"],
        "notes": "Iterate on profile."  # From endpoint if provided
    })
    return {"chat_history": reflection, "loop_count": state["loop_count"] + 1}

def router(state: MasteryState) -> Literal["reflect_node", END]:
    if state["loop_count"] > 3 or state["confidence_score"] >= 0.8:
        return END
    return "reflect_node"

# Build the graph
graph_builder = StateGraph(MasteryState)
graph_builder.add_node("invert_node", invert_node)
graph_builder.add_node("principles_node", principles_node)
graph_builder.add_node("rebuild_node", rebuild_node)
graph_builder.add_node("reflect_node", reflect_node)

graph_builder.add_edge(START, "invert_node")
graph_builder.add_edge("invert_node", "principles_node")
graph_builder.add_edge("principles_node", "rebuild_node")
graph_builder.add_conditional_edges("rebuild_node", router, ["reflect_node", END])
graph_builder.add_edge("reflect_node", "rebuild_node")

mastery_graph = graph_builder.compile()
