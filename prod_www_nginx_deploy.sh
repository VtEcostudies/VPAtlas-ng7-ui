sudo mv /var/www/vpatlas/ /var/www/$(date -d "today" +"%Y%m%d-%H%M")_vpatlas
sudo cp -r dist/vpatlas-angular-ui /var/www
sudo mv /var/www/vpatlas-angular-ui/ /var/www/vpatlas
sudo systemctl restart nginx
