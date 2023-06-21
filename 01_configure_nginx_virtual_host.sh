# remove any enabled default site configs from nginx sites-enabled (these are just symlinks to sites-available)
sudo rm /etc/nginx/sites-enabled/default
# copy virtual host config files to /etc/nginx/sites-available
sudo cp ./nginx_vpatlas_dev.conf /etc/nginx/sites-available/dev.vpatlas
sudo cp ./nginx_vpatlas.conf /etc/nginx/sites-available/vpatlas
# enable the appropriate vpatlas nginx site
#sudo ln -s /etc/nginx/sites-available/dev.vpatlas /etc/nginx/sites-enabled/dev.vpatlas
#sudo ln -s /etc/nginx/sites-available/vpatlas /etc/nginx/sites-enabled/vpatlas
#sudo systemctl restart nginx
