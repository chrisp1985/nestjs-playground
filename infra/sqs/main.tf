
terraform {
  required_version = ">= 1.5.0"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 6.0"
    }
  }
}

provider "aws" {
  region = "eu-west-2"
}

resource "aws_sqs_queue" "scouting_dlq" {
  name = "nestjs-playground-scouting-dlq"
}

resource "aws_sqs_queue" "scouting" {
  name                       = "nestjs-playground-scouting"
  visibility_timeout_seconds = 60
  receive_wait_time_seconds  = 20

  redrive_policy = jsonencode({
    deadLetterTargetArn = aws_sqs_queue.scouting_dlq.arn
    maxReceiveCount     = 3
  })
}

output "scouting_queue_url" {
  value = aws_sqs_queue.scouting.url
}

output "scouting_dlq_url" {
  value = aws_sqs_queue.scouting_dlq.url
}
