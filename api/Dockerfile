FROM mcr.microsoft.com/dotnet/sdk:9.0 AS build
WORKDIR /src
COPY WebAPI/WebAPI.csproj WebAPI/
RUN dotnet restore WebAPI/WebAPI.csproj
COPY WebAPI/ WebAPI/
WORKDIR /src/WebAPI
RUN dotnet publish -c Release -o /app/publish /p:UseAppHost=false

FROM mcr.microsoft.com/dotnet/aspnet:9.0 AS final
WORKDIR /app
COPY --from=build /app/publish .
ENV ASPNETCORE_URLS=http://+:8080
EXPOSE 8080
ENTRYPOINT ["dotnet", "WebAPI.dll"]
