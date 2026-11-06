variable "ssh_cidr" {
  description = "Public IPv4 address permitted to SSH into Lightsail"
  type        = string
}

variable "deploy_commit" {
  description = "Git commit SHA to deploy"
  type        = string

  validation {
    condition     = can(regex("^[0-9a-f]{40}$", var.deploy_commit))
    error_message = "Must be a full 40-character Git commit SHA."
  }
}