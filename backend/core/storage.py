import json
import uuid
from typing import BinaryIO

import boto3
from botocore.client import Config as BotoConfig
from botocore.exceptions import ClientError

from core.config import settings

_client = boto3.client(
    "s3",
    endpoint_url=settings.storage_endpoint_url,
    aws_access_key_id=settings.storage_access_key,
    aws_secret_access_key=settings.storage_secret_key,
    config=BotoConfig(signature_version="s3v4"),
    region_name=settings.storage_region,
)

_PUBLIC_READ_POLICY = {
    "Version": "2012-10-17",
    "Statement": [
        {
            "Effect": "Allow",
            "Principal": "*",
            "Action": "s3:GetObject",
            "Resource": f"arn:aws:s3:::{settings.storage_bucket}/*",
        }
    ],
}


def ensure_bucket() -> None:
    try:
        _client.head_bucket(Bucket=settings.storage_bucket)
    except ClientError:
        _client.create_bucket(Bucket=settings.storage_bucket)
        # Bucket publico para leitura -- MVP local (MinIO); em producao com
        # AWS S3/R2 real, trocar por URLs assinadas com expiracao.
        _client.put_bucket_policy(Bucket=settings.storage_bucket, Policy=json.dumps(_PUBLIC_READ_POLICY))


def upload_file(file_obj: BinaryIO, filename: str, content_type: str) -> str:
    key = f"{uuid.uuid4()}-{filename}"
    _client.upload_fileobj(file_obj, settings.storage_bucket, key, ExtraArgs={"ContentType": content_type})
    return f"{settings.storage_public_url}/{key}"
