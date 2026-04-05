# Christ Medical — Conversion Appliance (.NET ETL + mdbtools + psql client)
# Build from repository root:
#   docker build -f conversion/appliance/Dockerfile .

FROM mcr.microsoft.com/dotnet/sdk:10.0-preview-bookworm-slim AS build
WORKDIR /src
COPY conversion/etl-tool/ ./etl-tool/
RUN dotnet publish ./etl-tool/EtlTool.csproj -c Release -o /app/publish

FROM mcr.microsoft.com/dotnet/runtime:10.0-preview-bookworm-slim
RUN apt-get update \
 && apt-get install -y --no-install-recommends \
        mdbtools \
        postgresql-client \
        bash \
        ca-certificates \
 && rm -rf /var/lib/apt/lists/*

# Full conversion tree (SQL, data layout, scripts); publish output overlays etl-tool binaries.
COPY conversion/ /app/conversion/
COPY --from=build /app/publish /app/conversion/etl-tool/

WORKDIR /app/conversion/etl-tool

ENV DOTNET_ENVIRONMENT=Production

ENTRYPOINT ["dotnet", "EtlTool.dll"]
