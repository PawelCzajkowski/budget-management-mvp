FROM public.ecr.aws/lambda/python:3.12

# Copy requirements file
COPY requirements-sam.txt ${LAMBDA_TASK_ROOT}

# Install system dependencies and upgrade pip
RUN yum update -y && \
    yum install -y gcc gcc-c++ && \
    pip install --upgrade pip

# Install Python dependencies
RUN pip install -r requirements-sam.txt --no-cache-dir

# Copy function code
COPY src/ ${LAMBDA_TASK_ROOT}/src/

# Set the CMD to your handler
CMD ["src.main.handler"] 