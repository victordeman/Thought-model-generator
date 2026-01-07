from langchain_core.prompts import PromptTemplate
from langchain_core.output_parsers import StrOutputParser, JsonOutputParser
from langchain_openai import ChatOpenAI
from langchain.memory import ConversationBufferMemory
from langchain.chains import SequentialChain, LLMChain
from typing import Dict, Any
import json

class MasteryLoopChain:
    def __init__(self, llm: ChatOpenAI, memory: ConversationBufferMemory | None = None):
        self.llm = llm
        self.memory = memory or ConversationBufferMemory(memory_key="history")

        # Step 1: Invert Failure
        invert_prompt = PromptTemplate.from_template(
            "You are an expert programming mentor using Inversion Thinking.\n"
            "List 8-12 specific ways this code would guarantee terrible OOP design:\n\n{code}\n\n"
            "Output as a numbered list."
        )
        self.invert_chain = LLMChain(llm=llm, prompt=invert_prompt, output_key="failures")

        # Step 2: Strip to First Principles
        principles_prompt = PromptTemplate.from_template(
            "Extract the four core OOP first principles demonstrated or violated in this code.\n"
            "For each principle, give a mastery score 0.0-1.0 with a one-sentence justification.\n"
            "Code:\n{code}\n\n"
            "Return strict JSON: {{\"encapsulation\": score, \"abstraction\": score, ...}}"
        )
        self.principles_chain = LLMChain(
            llm=llm,
            prompt=principles_prompt,
            output_parser=JsonOutputParser(),
            output_key="principles_mastery"
        )

        # Step 3-5: Rebuild + Attack + Composition Check
        rebuild_prompt = PromptTemplate.from_template(
            "History so far:\n{history}\n\n"
            "Failures identified:\n{failures}\n\n"
            "Current mastery scores:\n{principles_mastery}\n\n"
            "Using only first-principles thinking, rewrite the code cleanly and explain the top 3 recommendations.\n"
            "Code:\n{code}\n\n"
            "Return JSON: {{\"recommendations\": [\"...\"], \"confidence_score\": float}}"
        )
        self.rebuild_chain = LLMChain(
            llm=llm,
            prompt=rebuild_prompt,
            output_parser=JsonOutputParser(),
            output_key="final_output"
        )

        # Full Sequential Chain
        self.full_chain = SequentialChain(
            chains=[self.invert_chain, self.principles_chain, self.rebuild_chain],
            input_variables=["code"],
            output_variables=["failures", "principles_mastery", "final_output"],
            memory=self.memory,
            verbose=True
        )

    async def run(self, code: str, domain: str = "OOP") -> Dict[str, Any]:
        result = await self.full_chain.acall({"code": code})
        
        # Parse final output
        final = result["final_output"]
        profile = {
            "domain": domain,
            "principles_mastery": result["principles_mastery"],
            "inversion_risks": result["failures"].split("\n"),
            "recommendations": final.get("recommendations", []),
            "confidence_score": final.get("confidence_score", 0.76),
            "history": self.memory.buffer
        }
        return profile
