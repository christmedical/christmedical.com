# Legacy / optional image — primary ETL appliance is conversion/appliance/Dockerfile
FROM mcr.microsoft.com/dotnet/sdk:10.0-preview-bookworm-slim AS build
WORKDIR /app
COPY conversion/etl-tool/EtlTool.csproj conversion/etl-tool/
RUN dotnet restore conversion/etl-tool/EtlTool.csproj
COPY . .
WORKDIR /app/conversion/etl-tool
RUN dotnet publish EtlTool.csproj -c Release -o /app/publish

FROM mcr.microsoft.com/dotnet/runtime:10.0-preview-bookworm-slim AS final
WORKDIR /app
COPY --from=build /app/publish .
ENTRYPOINT ["dotnet", "EtlTool.dll"]
