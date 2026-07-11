# Custom openGauss Database Image
# Extends the official openGauss image with our schema initialization
FROM enmotech/opengauss:latest

# Copy the initialization SQL script
# Files in /docker-entrypoint-initdb.d/ are automatically executed
# on FIRST container start (when the data volume is empty)
COPY init_db.sql /docker-entrypoint-initdb.d/01_init_schema.sql
