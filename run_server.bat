@echo off
echo Iniciando servidor local para o Ponto Eletronico...
echo O navegador sera aberto automaticamente.
echo Pressione Ctrl+C nesta janela para parar o servidor.
start http://localhost:8000
python -m http.server 8000
pause
