# remove any enabled vpatlas site configs from nginx sites-enabled (these are just symlinks to sites-available)
sudo rm /etc/nginx/sites-enabled/vpatlas
sudo rm /etc/nginx/sites-enabled/dev.vpatlas
# enable vpatlas host
sudo ln -s /etc/nginx/sites-available/vpatlas /etc/nginx/sites-enabled/vpatlas
sudo systemctl restart nginx
