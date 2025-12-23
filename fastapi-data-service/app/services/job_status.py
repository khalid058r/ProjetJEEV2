import boto3
import json
from app.core.config import AWS_BUCKET, AWS_REGION

s3 = boto3.client("s3", region_name=AWS_REGION)

def get_job_status(job_id: str):
    manifest_key = f"jobs/{job_id}/logs/manifest.json"

    try:
        manifest_obj = s3.get_object(
            Bucket=AWS_BUCKET,
            Key=manifest_key
        )
        manifest = json.loads(manifest_obj["Body"].read())
    except Exception:
        return {
            "job_id": job_id,
            "state": "NOT_FOUND",
            "progress": 0
        }

    total_chunks = manifest.get("chunks_created", 0)

    resp = s3.list_objects_v2(
        Bucket=AWS_BUCKET,
        Prefix=f"jobs/{job_id}/raw/"
    )

    completed_chunks = 0
    if "Contents" in resp:
        completed_chunks = len([
            obj for obj in resp["Contents"]
            if obj["Key"].endswith(".json")
        ])

    progress = int((completed_chunks / total_chunks) * 100) if total_chunks else 0

    state = "RUNNING"
    if completed_chunks >= total_chunks:
        state = "DONE"

    return {
        "job_id": job_id,
        "state": state,
        "progress": progress,
        "message": f"{completed_chunks}/{total_chunks} chunks processed"
    }
