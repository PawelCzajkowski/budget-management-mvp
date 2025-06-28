from langchain.chat_models import init_chat_model
from langchain_core.prompts import ChatPromptTemplate
from typing import cast

from models.BudgetDTO import BudgetDTO

prompt_template = ChatPromptTemplate.from_messages(
    [
        (
            "system",
            "You are an expert extraction algorithm. "
            "Only extract relevant information from the csv file data. "
            "If you do not know the value of an attribute asked to extract, "
            "return null for the attribute's value."
            "File can contain multiple budgets and periods. Not all data may be relevant."
            "Don't return any additional information, just the extracted data in the format specified below."
            "Do not do any calculations, just extract the data as it is.",
        ),
        ("human", "{text}"),
    ]
)

# llm = init_chat_model("gemini-2.5-flash", model_provider="google_genai")
llm = init_chat_model("gpt-4.1-mini", model_provider="openai")

structured_response = llm.with_structured_output(schema=BudgetDTO)

def extract_budget_from_text(text: str) -> BudgetDTO:
    """
    Extract budget information from a text and return it as a Budget object.
    
    :param text: Text containing budget data.
    :return: A Budget object populated with the extracted data.
    """
    prompt = prompt_template.invoke({"text": text})
    response = structured_response.invoke(prompt)
    budget = cast(BudgetDTO, response)

    return budget

def extract_budget_from_csv(file_path: str) -> BudgetDTO:
    """
    Extract budget information from a CSV file and return it as a Budget object.
    
    :param file_path: Path to the CSV file containing budget data.
    :return: A Budget object populated with the extracted data.
    """
    import csv
    with open(file_path, mode='r') as file:
        csv_reader = csv.reader(file)
        text = "\n".join([",".join(row) for row in csv_reader])
    
    return extract_budget_from_text(text)

def extract_budget_from_bytes(csv_bytes: bytes) -> BudgetDTO:
    """
    Extract budget information from CSV bytes data and return it as a Budget object.
    File can contain multiple budgets and periods.
    Some data may be missing and some are not relevant.
    
    :param csv_bytes: CSV data as bytes
    :return: A Budget object populated with the extracted data.
    """
    import io
    import csv
    
    # Convert bytes to text stream
    text_stream = io.TextIOWrapper(io.BytesIO(csv_bytes), encoding='utf-8')
    csv_reader = csv.reader(text_stream)
    text = "\n".join([",".join(row) for row in csv_reader])

    return extract_budget_from_text(text)
