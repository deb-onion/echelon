#!/bin/bash
set -e

# Check if required config files exist
if [ ! -f "/app/config/google-ads.yaml" ]; then
  echo "Error: google-ads.yaml configuration file not found."
  echo "Please mount a volume containing your configuration files."
  exit 1
fi

# Create directory structure if needed
for i in {1..10}; do
  mkdir -p "/app/logs/account_$i"
done

# Set PYTHONPATH to include the app directory
export PYTHONPATH=/app:$PYTHONPATH

# Execute the command passed to docker run
exec "$@" 