sudo mv /var/www/dev.vpatlas/ /var/www/$(date -d "today" +"%Y%m%d-%H%M")_dev.vpatlas
sudo cp -r dist/vpatlas-angular-ui /var/www
sudo mv /var/www/vpatlas-angular-ui/ /var/www/dev.vpatlas
sudo systemctl restart nginx
