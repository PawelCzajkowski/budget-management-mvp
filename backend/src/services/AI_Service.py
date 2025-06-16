from langchain.chat_models import init_chat_model
from langchain_core.prompts import ChatPromptTemplate

from models.BudgetDTO import ComplexBudgetDTO

prompt_template = ChatPromptTemplate.from_messages(
    [
        (
            "system",
            "You are an expert extraction algorithm. "
            "Only extract relevant information from the csv file data. "
            "If you do not know the value of an attribute asked to extract, "
            "return null for the attribute's value.",
        ),
        ("human", "{text}"),
    ]
)

llm = init_chat_model("gemini-2.5-flash-preview-05-20", model_provider="google_genai")

structured_response = llm.with_structured_output(schema=ComplexBudgetDTO)

def extract_budget_from_csv(file_path: str):
    """
    Extract budget information from a CSV file and return it as a Budget object.
    File can contain multiple budgets and periods.
    Some data may be missing and some are not relevant.
    
    :param file_path: Path to the CSV file containing budget data.
    :return: A Budget object populated with the extracted data.
    """
    import csv
    with open(file_path, mode='r') as file:
        csv_reader = csv.reader(file)
        text = "\n".join([",".join(row) for row in csv_reader])
    
    prompt = prompt_template.invoke({"text": text})
    response = structured_response.invoke(prompt)

    return response
