
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

resource "aws_lightsail_instance" "app" {
  name              = "nestjs-playground"
  availability_zone = "eu-west-2a"
  blueprint_id      = "ubuntu_24_04"
  bundle_id         = "small_3_0"
  user_data = replace(
    file("${path.module}/bootstrap.sh"),
    "__DEPLOY_COMMIT__",
    var.deploy_commit
  )

  tags = {
    Project     = "nestjs-playground"
    Environment = "learning"
  }
}

resource "aws_lightsail_static_ip" "app" {
  name = "nestjs-playground-ip"
}

resource "aws_lightsail_static_ip_attachment" "app" {
  static_ip_name = aws_lightsail_static_ip.app.name
  instance_name  = aws_lightsail_instance.app.name
}

resource "aws_lightsail_instance_public_ports" "app" {
  instance_name = aws_lightsail_instance.app.name

  port_info {
    protocol  = "tcp"
    from_port = 80
    to_port   = 80
    cidrs     = ["0.0.0.0/0"]
  }

  port_info {
    protocol  = "tcp"
    from_port = 443
    to_port   = 443
    cidrs     = ["0.0.0.0/0"]
  }

  port_info {
    protocol  = "tcp"
    from_port = 22
    to_port   = 22
    cidrs     = [var.ssh_cidr]
  }
}
