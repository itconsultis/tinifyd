FROM docker.it-consultis.com.cn/itc/buildpack-node:0.1.0
MAINTAINER Rich Choy <rich@it-consultis.com>

ENV TINIFYD_PREFIX /opt/tinifyd

COPY ./src $TINIFYD_PREFIX
WORKDIR $TINIFYD_PREFIX

RUN chown -R root:root $TINIFYD_PREFIX
RUN echo $(whoami)
RUN rm -rf .env node_modules/mmmagic/build
RUN npm --unsafe-perm rebuild

USER node

ENTRYPOINT bin/pm2 start
