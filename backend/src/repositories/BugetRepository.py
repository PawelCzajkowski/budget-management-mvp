from typing import Optional, List, cast
import boto3
import os
from dotenv import load_dotenv
from models.Budget import Budget, BudgetItem, Period, Expense
from decimal import Decimal
import json
import logging
from botocore.exceptions import ClientError
from boto3.dynamodb.conditions import Key

# Load environment variables
load_dotenv()

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class BudgetRepository:
    def __init__(self):
        endpoint_url = os.getenv('DYNAMODB_ENDPOINT_URL', 'http://localhost:5555')
        self.table_name = os.getenv('DYNAMODB_TABLE_NAME', 'budgets')
        
        logger.info(f"Initializing DynamoDB with endpoint URL: {endpoint_url}")
        logger.info(f"Using table name: {self.table_name}")
        
        # Initialize DynamoDB client and resource
        self.dynamodb_client = boto3.client(
            'dynamodb',
            region_name=os.getenv('AWS_REGION'),
            aws_access_key_id=os.getenv('AWS_ACCESS_KEY_ID'),
            aws_secret_access_key=os.getenv('AWS_SECRET_ACCESS_KEY'),
            endpoint_url=endpoint_url
        )
        
        self.dynamodb = boto3.resource(
            'dynamodb',
            region_name=os.getenv('AWS_REGION'),
            aws_access_key_id=os.getenv('AWS_ACCESS_KEY_ID'),
            aws_secret_access_key=os.getenv('AWS_SECRET_ACCESS_KEY'),
            endpoint_url=endpoint_url
        )
        
        # Ensure table exists
        self._ensure_table_exists()
        self.table = self.dynamodb.Table(self.table_name)

    def _ensure_table_exists(self):
        """
        Check if the table exists, if not create it
        """
        try:
            logger.info(f"Checking if table {self.table_name} exists...")
            self.dynamodb_client.describe_table(TableName=self.table_name)
            logger.info(f"Table {self.table_name} exists")
        except ClientError as e:
            if e.response['Error']['Code'] == 'ResourceNotFoundException':
                logger.info(f"Table {self.table_name} does not exist. Creating...")
                try:
                    # Create the DynamoDB table
                    self.dynamodb_client.create_table(
                        TableName=self.table_name,
                        AttributeDefinitions=[
                            {
                                'AttributeName': 'id',
                                'AttributeType': 'S'
                            },
                            {
                                'AttributeName': 'user_id',
                                'AttributeType': 'S'
                            }
                        ],
                        KeySchema=[
                            {
                                'AttributeName': 'id',
                                'KeyType': 'HASH'
                            }
                        ],
                        ProvisionedThroughput={
                            'ReadCapacityUnits': 5,
                            'WriteCapacityUnits': 5
                        },
                        GlobalSecondaryIndexes=[
                            {
                                'IndexName': 'user_id-index',
                                'KeySchema': [
                                    {
                                        'AttributeName': 'user_id',
                                        'KeyType': 'HASH'
                                    }
                                ],
                                'Projection': {
                                    'ProjectionType': 'ALL'
                                },
                                'ProvisionedThroughput': {
                                    'ReadCapacityUnits': 5,
                                    'WriteCapacityUnits': 5
                                }
                            }
                        ]
                    )
                    # Wait until the table exists
                    logger.info("Waiting for table to be created...")
                    waiter = self.dynamodb_client.get_waiter('table_exists')
                    waiter.wait(TableName=self.table_name)
                    logger.info(f"Table {self.table_name} created successfully")
                except Exception as create_error:
                    logger.error(f"Failed to create table: {str(create_error)}")
                    raise
            else:
                logger.error(f"Error checking table existence: {str(e)}")
                raise

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
            'name': budget['name'],
            'created_at': budget['created_at'],
            'updated_at': budget['updated_at'],
            'user_id': budget['user_id'],
            'period_names': budget['period_names'],
            'list_of_budget_items': [
                {
                    'id': item['id'],
                    'created_at': item['created_at'],
                    'updated_at': item['updated_at'],
                    'owner_id': item['owner_id'],
                    'label': item['label'],
                    'account_number': item['account_number'],
                    'category': item['category'],
                    'summary': str(item['summary']),
                    'periods': [
                        {
                            'id': period['id'],
                            'label': period['label'],
                            'created_at': period['created_at'],
                            'updated_at': period['updated_at'],
                            'planned_amount': str(period['planned_amount']),
                            'budget_id': period['budget_id'],
                            'budget_item_id': period['budget_item_id'],
                            'expense_list': [
                                {
                                    'id': expense['id'],
                                    'category': expense['category'],
                                    'name': expense['name'],
                                    'owner_id': expense['owner_id'],
                                    'account_number': expense['account_number'],
                                    'amount': str(expense['amount']),
                                    'period_id': expense['period_id'],
                                    'budget_id': expense['budget_id'],
                                    'created_at': expense['created_at'],
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

    def get_budget(self, budget_id: str, user_id: str) -> Optional[Budget]:
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

    def get_budgets_id_by_user(self, user_id: str) -> list[str]:
        """
        Retrieve all budget IDs for a specific user
        """
        try:
            response = self.table.query(
                IndexName="user_id-index",
                KeyConditionExpression=Key("user_id").eq(user_id),
                ProjectionExpression="id"
            )
            ids = [str(item["id"]) for item in response.get("Items", [])]
            return ids
        except Exception as e:
            logger.exception(f"Failed to get budget IDs from DynamoDB: {str(e)}")
            raise Exception(f"Failed to get budget IDs from DynamoDB: {str(e)}")
