from typing import Optional, cast
import boto3
import os
from dotenv import load_dotenv
from src.models.Budget import Budget
from decimal import Decimal
import logging
from boto3.dynamodb.conditions import Key
import botocore.exceptions
import json
from datetime import datetime, timezone
import uuid

# Load environment variables
load_dotenv()

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class BudgetRepository:
    def __init__(self):
        self.table_name = os.getenv('DYNAMODB_TABLE_NAME', 'budget-management-mvp-budgets')
        REGION = os.getenv('AWS_REGION', 'eu-north-1')

        logger.info(f"Using table name: {self.table_name}")
        
        # Initialize DynamoDB client and resource for Lambda
        self.dynamodb_client = boto3.client(
            'dynamodb',
            region_name=REGION
        )
        
        self.dynamodb = boto3.resource(
            'dynamodb',
            region_name=REGION
        )
        
        # Ensure table exists
        self.table = self.dynamodb.Table(self.table_name)
        
        try:
            self.table.load()
            logger.info(f"Connected to DynamoDB table: {self.table_name}")
        except botocore.exceptions.ClientError as e:
            error_code = e.response.get('Error', {}).get('Code')
            if error_code == 'ResourceNotFoundException':
                logger.error(f"Table {self.table_name} does not exist. Please create the table before using the repository.")
                raise Exception(f"Table {self.table_name} does not exist. Please create the table before using the repository.")
            else:
                logger.error(f"ClientError when loading table {self.table_name}: {e}")
                raise
        except Exception as e:
            logger.error(f"Failed to connect to DynamoDB table {self.table_name}: {str(e)}")
            raise Exception(f"Failed to connect to DynamoDB table {self.table_name}: {str(e)}")

    def _serialize_budget(self, budget: Budget) -> dict:
        """
        Convert Budget TypedDict to DynamoDB-compatible dictionary
        """
        def decimal_default(obj):
            if isinstance(obj, Decimal):
                return str(obj)
            raise TypeError

        # Convert to dict and handle Decimal serialization
        budget_dict = {
            'id': budget['id'],
            'title': budget['title'],
            'description': budget['description'],
            'created_at': budget['created_at'],
            'updated_at': budget['updated_at'],
            'user_id': budget['user_id'],
            'period_names': budget['period_names'],
            'list_of_budget_items': [
                {
                    'updated_at': item['updated_at'],
                    'owner_id': item['owner_id'],
                    'label': item['label'],
                    'account_number': item['account_number'],
                    'category': item['category'],
                    'summary': str(item['summary']),
                    'periods': [
                        {
                            'label': period['label'],
                            'updated_at': period['updated_at'],
                            'planned_amount': str(period['planned_amount']),
                            'expense_list': [
                                {
                                    'name': expense['name'],
                                    'owner_id': expense['owner_id'],
                                    'account_number': expense['account_number'],
                                    'amount': str(expense['amount']),
                                    'updated_at': expense['updated_at']
                                }
                                for expense in period['expense_list']
                            ]
                        }
                        for period in item['periods']
                    ]
                }
                for item in budget['list_of_budget_items']
            ]
        }
        
        return budget_dict

    def put_budget(self, budget: Budget) -> None:
        """
        Store a budget in DynamoDB
        """
        try:
            item = self._serialize_budget(budget)
            self.table.put_item(Item=item)
        except Exception as e:
            raise Exception(f"Failed to put budget into DynamoDB: {str(e)}")
        
    def update_budget(self, budget: Budget) -> None:
        """
        Update an existing budget in DynamoDB
        """
        try:
            item = self._serialize_budget(budget)
            self.table.put_item(
                Item=item,
                ConditionExpression='attribute_exists(id)'  # Ensure the budget exists before updating
            )
        except Exception as e:
            raise Exception(f"Failed to update budget in DynamoDB: {str(e)}")

    def get_budget(self, budget_id: str) -> Optional[Budget]:
        """
        Retrieve a budget from DynamoDB by its ID
        """
        try:
            response = self.table.get_item(Key={'id': budget_id})
            logger.info(f"DynamoDB response: {response}")

            if 'Item' not in response:
                logger.warning(f"No item found for budget_id: {budget_id}")
                return None

            # Convert DynamoDB item to Budget TypedDict
            item = response['Item']

            # Ensure list_of_budget_items is a list
            item['list_of_budget_items'] = item.get('list_of_budget_items', [])
            if not isinstance(item['list_of_budget_items'], list):
                logger.error(f"Invalid list_of_budget_items: {item['list_of_budget_items']}")
                item['list_of_budget_items'] = []

            # Convert string amounts back to Decimal
            for budget_item in item['list_of_budget_items']:
                budget_item['summary'] = Decimal(budget_item['summary'])
                for period in budget_item['periods']:
                    period['planned_amount'] = Decimal(period['planned_amount'])
                    for expense in period['expense_list']:
                        expense['amount'] = Decimal(expense['amount'])

            return cast(Budget, item)
        except Exception as e:
            logger.exception(f"Failed to get budget from DynamoDB: {str(e)}")
            raise Exception(f"Failed to get budget from DynamoDB: {str(e)}")

    def get_budgets_by_user(self, user_id: str) -> list[Budget]:
        """
        Retrieve all budgets for a specific user
        """
        try:
            response = self.table.query(
                IndexName='user_id-index',  # Assuming you have a GSI on user_id
                KeyConditionExpression='user_id = :uid',
                ExpressionAttributeValues={':uid': user_id}
            )
            logger.info(f"DynamoDB query response: {response}")

            items = response.get('Items', [])

            # Ensure list_of_budget_items is a list for each item
            for item in items:
                item['list_of_budget_items'] = item.get('list_of_budget_items', [])
                if not isinstance(item['list_of_budget_items'], list):
                    logger.error(f"Invalid list_of_budget_items: {item['list_of_budget_items']}")
                    item['list_of_budget_items'] = []

                for budget_item in item['list_of_budget_items']:
                    budget_item['summary'] = Decimal(budget_item['summary'])
                    for period in budget_item['periods']:
                        period['planned_amount'] = Decimal(period['planned_amount'])
                        for expense in period['expense_list']:
                            expense['amount'] = Decimal(expense['amount'])

            return cast(list[Budget], items)
        except Exception as e:
            logger.exception(f"Failed to get budgets from DynamoDB: {str(e)}")
            raise Exception(f"Failed to get budgets from DynamoDB: {str(e)}")

    def get_budgets_id_by_user(self, user_id: str) -> list[dict]:
        """
        Retrieve all budget IDs for a specific user
        """
        try:
            response = self.table.query(
                IndexName="user_id-index",
                KeyConditionExpression=Key("user_id").eq(user_id),
                ProjectionExpression="id, title"
            )
            return [{"id": item["id"], "title": item.get("title", "")} for item in response.get("Items", [])]
        except Exception as e:
            logger.exception(f"Failed to get budget IDs from DynamoDB: {str(e)}")
            raise Exception(f"Failed to get budget IDs from DynamoDB: {str(e)}")

    def delete_budget(self, budget_id: str) -> None:
        """
        Delete a budget from DynamoDB by its ID
        """
        try:
            self.table.delete_item(Key={'id': budget_id})
        except Exception as e:
            logger.exception(f"Failed to delete budget from DynamoDB: {str(e)}")
            raise Exception(f"Failed to delete budget from DynamoDB: {str(e)}")
