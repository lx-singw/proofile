#!/bin/bash
# setup-dev.sh: Comprehensive development environment setup for Proofile Vocational

echo "🚀 Starting Proofile Vocational Environment Setup..."

# --- System Update & Core Dependencies ---
echo "🔄 Updating package lists and installing core dependencies..."
sudo apt-get update && sudo apt-get upgrade -y
sudo apt-get install -y curl wget git build-essential software-properties-common zsh

# --- Node.js (via NVM for version management) ---
echo "📦 Installing Node.js Version Manager (NVM) and Node.js v18..."
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash
export NVM_DIR="$HOME/.nvm"
 && \. "$NVM_DIR/nvm.sh"
 && \. "$NVM_DIR/bash_completion"
nvm install 18
nvm use 18
nvm alias default 18

# --- Python (via PPA for specific version) & Poetry for dependency management ---
echo "🐍 Installing Python 3.11 and Poetry..."
sudo add-apt-repository ppa:deadsnakes/ppa -y
sudo apt-get install -y python3.11 python3.11-venv python3.11-dev
# Install pip for python3.11
curl -sS https://bootstrap.pypa.io/get-pip.py | python3.11
# Install Poetry
curl -sSL https://install.python-poetry.org | python3.11 -

# --- Docker & Docker Compose ---
echo "🐳 Installing Docker and Docker Compose..."
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER
rm get-docker.sh

# --- Ancillary Tools ---
echo "🛠️ Installing PostgreSQL Client and Pre-commit..."
sudo apt-get install -y postgresql-client
python3.11 -m pip install pre-commit

# --- Verification ---
echo "✅ Verification:"
echo "-----------------"
echo -n "Node version: " && node --version
echo -n "Python version: " && python3.11 --version
echo -n "Poetry version: " && ~/.local/bin/poetry --version
echo "Docker version:" && docker --version
echo "-----------------"
echo "🎉 Setup complete! Please run 'source ~/.bashrc' or restart your terminal."
echo "Then, run 'newgrp docker' to apply Docker group changes."