# vpatlas-angular-ui

The VPAtlas UI using Angular CLI.

VPAtlas UX requires that nginx be installed.

Configure nginx:
- 01_configure_nginx_virtual_host.sh

Install and Deploy VPAtlas to dev-remote:
- 02_enable_nginx_virtual_host_dev.sh
- git clone https://github.com/VtEcostudies/VPAtlas-ng7-ui.git
- git checkout v3_dev
- npm install
- dev_www_nginx_deploy.sh

Install and Deploy VPAtlas to production:
- 03_enable_nginx_virtual_host_prod.sh
- git clone https://github.com/VtEcostudies/VPAtlas-ng7-ui.git
- git checkout master
- npm install
- prod_www_nginx_deploy.sh

Shield: [![CC BY-NC-SA 4.0][cc-by-nc-sa-shield]][cc-by-nc-sa]

This work is licensed under a [Creative Commons Attribution-NonCommercial-ShareAlike 4.0
International License][cc-by-nc-sa].

[![CC BY-NC-SA 4.0][cc-by-nc-sa-image]][cc-by-nc-sa]

[cc-by-nc-sa]: http://creativecommons.org/licenses/by-nc-sa/4.0/
[cc-by-nc-sa-image]: https://licensebuttons.net/l/by-nc-sa/4.0/88x31.png
[cc-by-nc-sa-shield]: https://img.shields.io/badge/License-CC%20BY-NC-SA%204.0-lightgrey.svg
