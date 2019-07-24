FROM maven:3.5.3-jdk-8
MAINTAINER Bernhard Kaszt <b.kaszt@gentics.com>

ARG GIT_USER_NAME="Maven Release Manager"
ARG GIT_USER_EMAIL="entwicklung@gentics.com"
ARG USER_NAME="jenkins"


COPY sources.list /etc/apt/sources.list
RUN apt-get update \
  && apt-get install --assume-yes \
    lsb-release \
    curl \
    git-core \
    gawk \
    sed \
    curl \
    build-essential \
    less \
    vim \
    tar \
    sed \
    psmisc \
    locales \
    ruby \
    ruby-dev \
    zip\
    unzip

ENV JAVA_HOME /usr/lib/jvm/java-8-openjdk-amd64
ENV JAVA_1_8_HOME /usr/lib/jvm/java-8-openjdk-amd64

# Set the locale (needed for ruby guides)
RUN sed -i -e 's/# en_US.UTF-8 UTF-8/en_US.UTF-8 UTF-8/' /etc/locale.gen && \
    locale-gen
ENV LANG en_US.UTF-8
ENV LANGUAGE en_US:en
ENV LC_ALL en_US.UTF-8

# Install guides
RUN gem install guides -- --with-cflags=\"-O2 -pipe -march=native -w\"

# Add user
# The ID / GID 10000 is used by the jenkinsci/slave Dockerfile and has to match here, because Jenkins
# does the SCM checkout in the jnlp container for some reasons.
RUN groupadd --system --gid 10000 ${USER_NAME} && useradd --create-home --no-log-init --uid 10000 --gid ${USER_NAME} ${USER_NAME}

# Install nodejs
RUN set -ex \
  && for key in \
    9554F04D7259F04124DE6B476D5A82AC7E37093B \
    94AE36675C464D64BAFA68DD7434390BDBE9B9C5 \
    0034A06D9D9B0064CE8ADF6BF1747F4AD2306D93 \
    FD3A5288F042B6850C66B31F09FE44734EB7990E \
    71DCFD284A79C3B38668286BC97EC7A07EDE3FC1 \
    DD8F2338BAE7501E3DD5AC78C273792F7D83545D \
    B9AE9905FFD7803F25714661B63B535A4C206CA9 \
    C4F0DFFF4E8C1A8236409D08E73BC641CC11F4C8 \
  ; do \
    gpg --batch --keyserver sks-keyservers.net --recv-keys "$key"; \
  done

ENV NPM_CONFIG_LOGLEVEL info
ENV NODE_VERSION 6.1.0

RUN mkdir /opt/node
RUN curl -SLO "https://nodejs.org/dist/v$NODE_VERSION/node-v$NODE_VERSION-linux-x64.tar.xz" \
  && curl -SLO "https://nodejs.org/dist/v$NODE_VERSION/SHASUMS256.txt.asc" \
  && gpg --batch --decrypt --output SHASUMS256.txt SHASUMS256.txt.asc \
  && grep " node-v$NODE_VERSION-linux-x64.tar.xz\$" SHASUMS256.txt | sha256sum -c - \
  && tar -xJf "node-v$NODE_VERSION-linux-x64.tar.xz" -C /opt/node --strip-components=1 \
  && rm "node-v$NODE_VERSION-linux-x64.tar.xz" SHASUMS256.txt.asc SHASUMS256.txt
RUN ln -s /opt/node/bin/node /usr/local/bin/node
RUN ln -s /opt/node/bin/npm /usr/local/bin/npm
RUN echo "export PATH=\$PATH:/opt/node/bin" > /etc/profile.d/nodejs.sh && chmod +x /etc/profile.d/*

# Useful npm modules
RUN npm install bower gulp raml2html -g
RUN npm install changelog2html  -g

# Fix nodejs permissions for jenkins user
RUN chown -R 10000:10000 /opt/node

# Setup Git
RUN git config --system user.name "${GIT_USER_NAME}"
RUN git config --system user.email "${GIT_USER_EMAIL}"

RUN echo "StrictHostKeyChecking no" > /etc/ssh/ssh_config
RUN echo "UserKnownHostsFile=/dev/null" >> /etc/ssh/ssh_config
RUN echo "BatchMode yes" >> /etc/ssh/ssh_config
RUN mv /usr/share/maven/conf/settings.xml /usr/share/maven/conf/settings-original.xml
COPY settings.xml /usr/share/maven/conf/settings.xml

USER ${USER_NAME}

# Workaround for Maven not outputting colors and silence download progress messages
ENV MAVEN_OPTS "-Djansi.passthrough=true"

RUN mkdir -p ~/workspace
RUN mkdir -p ~/.m2/repository
