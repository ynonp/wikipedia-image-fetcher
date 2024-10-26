FROM denoland/deno:2.0.3

# The port that your application listens to.
EXPOSE 8000

WORKDIR /app
RUN bash -c "mkdir -p /app/files && chown -R deno /app/files"

# Prefer not to run as root.
USER deno

RUN deno install

# These steps will be re-run upon each file change in your working directory:
COPY . .
# Compile the main app so that it doesn't need to be compiled each startup/entry.
RUN deno cache main.ts

CMD ["run", "-A", "main.ts"]