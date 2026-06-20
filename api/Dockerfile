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
COPY conversion/etl/V1__Initial_Schema.sql conversion/etl/V4__Patients_spiritual.sql conversion/etl/V6__patients_phonetic.sql conversion/etl/V7__patients_legacy_contact.sql conversion/etl/V9__tenants_and_auth.sql /app/sql/
COPY demo/db/99_demo_seed.sql /app/sql/
ENV ASPNETCORE_URLS=http://+:8080
EXPOSE 8080
ENTRYPOINT ["dotnet", "WebAPI.dll"]
