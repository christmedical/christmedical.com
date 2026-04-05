FROM mcr.microsoft.com/dotnet/sdk:9.0 AS build
WORKDIR /src
COPY api/WebAPI.csproj api/
RUN dotnet restore api/WebAPI.csproj
COPY api/ api/
WORKDIR /src/api
RUN dotnet publish -c Release -o /app/publish /p:UseAppHost=false

FROM mcr.microsoft.com/dotnet/aspnet:9.0 AS final
WORKDIR /app
COPY --from=build /app/publish .
ENV ASPNETCORE_URLS=http://+:8080
EXPOSE 8080
ENTRYPOINT ["dotnet", "WebAPI.dll"]
