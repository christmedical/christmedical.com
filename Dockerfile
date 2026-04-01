# Build Stage
FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /app

# Copy csproj and restore as distinct layers
COPY ["EtlTool/EtlTool.csproj", "EtlTool/"]
RUN dotnet restore "EtlTool/EtlTool.csproj"

# Copy everything else and build
COPY . .
WORKDIR "/app/EtlTool"
RUN dotnet build "EtlTool.csproj" -c Release -o /app/build

# Final Stage
FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS final
WORKDIR /app
COPY --from=build /app/build .

# Entrypoint will vary based on if you are running API or ETL
ENTRYPOINT ["dotnet", "EtlTool.dll"]