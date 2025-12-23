import boto3
import json
import uuid
from app.core.config import AWS_BUCKET, DISPATCHER_LAMBDA, AWS_REGION

s3 = boto3.client("s3", region_name=AWS_REGION)
lambda_client = boto3.client("lambda", region_name=AWS_REGION)

async def start_etl(file):
    
    job_id = str(uuid.uuid4())

    s3_key = f"jobs/{job_id}/input/source.csv"
    content = await file.read()

    s3.put_object(
        Bucket=AWS_BUCKET,
        Key=s3_key,
        Body=content,
        ContentType="text/csv"
    )

    payload = {
        "job_id": job_id,
        "input_key": s3_key
    }

    lambda_client.invoke(
        FunctionName=DISPATCHER_LAMBDA,
        InvocationType="Event",  # async
        Payload=json.dumps(payload)
    )

    return job_id
