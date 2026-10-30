@echo off
title Lancement Suivi de Compte

echo ==========================================
echo   DEMARRAGE DE L'APPLICATION DE COMPTE
echo ==========================================

:: Étape 1 : Vérification du dossier node_modules
if exist "node_modules" goto SERVER_START

echo [INFO] Le dossier node_modules est absent.
echo [INFO] Installation des dependances en cours (npm install)...
echo ------------------------------------------
call npm install
echo ------------------------------------------
echo [INFO] Installation terminee !
echo.

:SERVER_START
:: Étape 2 : Lancement du serveur (Le >nul masque le message initial de Node pour ne pas casser le décompte)
echo [1/2] Demarrage du serveur...
start /b node server.js >nul 2>&1

:: Étape 3 : Décompte visuel propre et cadencé
echo.
echo [INFO] Initialisation du serveur en cours...
echo 5...
timeout /t 1 /nobreak >nul
echo 4...
timeout /t 1 /nobreak >nul
echo 3...
timeout /t 1 /nobreak >nul
echo 2...
timeout /t 1 /nobreak >nul
echo 1...
timeout /t 1 /nobreak >nul
echo [INFO] Serveur pret !
echo.

:: Étape 4 : Ouverture du navigateur
echo [2/2] Ouverture de l'interface graphique...
start http://localhost:3000/index.html

echo ==========================================
echo   APPLICATION EN COURS D'EXECUTION !
echo ==========================================
echo Tu peux reduire cette fenetre.
echo Pour FERMER l'application et couper le serveur, appuie sur une touche...
pause >nul

:: Étape 5 : Nettoyage à la fermeture
taskkill /f /im node.exe >nul
exit
