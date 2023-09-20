FROM docker.apa-it.at/maven:3.8.6-jdk-8-slim
MAINTAINER Patrick Klaffenböck <p.klaffenboeck@gentics.com>

ARG GIT_USER_NAME="Maven Release Manager"
ARG GIT_USER_EMAIL="entwicklung@gentics.com"
ARG USER_NAME="jenkins"
ARG DEBIAN_RELEASE="bullseye"
ARG NPM_CONFIG_LOGLEVEL=info
ARG NODE_VERSION=16.16.0

ENV PATH "/usr/local/rvm/bin:$PATH"
ENV RVM_PATH "/usr/local/rvm"
ENV JAVA_HOME /usr/local/openjdk-8
ENV JAVA_1_8_HOME /usr/local/openjdk-8
ENV LANG en_US.UTF-8
ENV LANGUAGE en_US:en
ENV LC_ALL en_US.UTF-8
# Workaround for Maven not outputting colors and silence download progress messages
ENV MAVEN_OPTS "-Djansi.passthrough=true"

RUN echo "deb http://ftp.at.debian.org/debian ${DEBIAN_RELEASE} main contrib non-free" > /etc/apt/sources.list \
	&& echo "deb http://ftp.at.debian.org/debian ${DEBIAN_RELEASE}-backports main" >> /etc/apt/sources.list \
	&& echo "deb http://security.debian.org/debian-security ${DEBIAN_RELEASE}-security main" >> /etc/apt/sources.list \
	&& echo "deb http://ftp.at.debian.org/debian ${DEBIAN_RELEASE}-updates main" >> /etc/apt/sources.list \
	&& apt-get update \
	&& apt-get upgrade --assume-yes \
	&& apt-get install --assume-yes \
		lsb-release curl git-core gawk sed curl build-essential less vim \
		tar sed psmisc locales zip unzip gnupg2

COPY settings.xml /usr/share/maven/conf/settings.xml

# Set the locale (needed for ruby guides)
RUN sed -i -e 's/# en_US.UTF-8 UTF-8/en_US.UTF-8 UTF-8/' /etc/locale.gen \
	&& locale-gen

# Add user. The ID / GID 10000 is used by the jenkinsci/slave Dockerfile and has
# to match here, because Jenkins does the SCM checkout in the jnlp container for
# some reason.
RUN groupadd --system --gid 10000 ${USER_NAME} \
    && useradd --create-home --no-log-init --uid 10000 --gid ${USER_NAME} ${USER_NAME}

# Setup Git
RUN git config --system user.name "${GIT_USER_NAME}" \
	&& git config --system user.email "${GIT_USER_EMAIL}"

RUN echo "StrictHostKeyChecking no" > /etc/ssh/ssh_config \
	&& echo "UserKnownHostsFile=/dev/null" >> /etc/ssh/ssh_config \
	&& echo "BatchMode yes" >> /etc/ssh/ssh_config \
	&& mv /usr/share/maven/conf/settings.xml /usr/share/maven/conf/settings-original.xml

# Update public keys for node installs.
RUN set -ex \
	&& for key in \
		0034A06D9D9B0064CE8ADF6BF1747F4AD2306D93 \
		4ED778F539E3634C779C87C6D7062848A1AB005C \
		71DCFD284A79C3B38668286BC97EC7A07EDE3FC1 \
    	74F12602B6F1C4E913FAA37AD3A89613643B6201 \
		94AE36675C464D64BAFA68DD7434390BDBE9B9C5 \
		9554F04D7259F04124DE6B476D5A82AC7E37093B \
		B9AE9905FFD7803F25714661B63B535A4C206CA9 \
		C4F0DFFF4E8C1A8236409D08E73BC641CC11F4C8 \
		DD8F2338BAE7501E3DD5AC78C273792F7D83545D \
		FD3A5288F042B6850C66B31F09FE44734EB7990E \
		; do \
			gpg2 --batch --keyserver keys.openpgp.org --recv-keys "$key"; \
		done

# Install Ruby 2.3 with RVM
RUN curl -sSL https://rvm.io/mpapis.asc | gpg2 --import - \
	&& curl -sSL https://rvm.io/pkuczynski.asc | gpg2 --import - \
	&& curl -sSL https://get.rvm.io | bash \
	&& rvm pkg install openssl \
	&& rvm install --autolibs=disable 2.3 -C --with-openssl-dir=$RVM_PATH/usr

# Install Guides
COPY guides-wrapper.sh /usr/local/bin/guides
RUN rvm-exec 2.3 gem install guides -- --with-cflags="-O2 -pipe -march=native -w" \
	&&	chmod +x /usr/local/bin/guides

RUN mkdir /opt/node \
	&& curl -SLO "https://nodejs.org/dist/v$NODE_VERSION/node-v$NODE_VERSION-linux-x64.tar.xz" \
	&& curl -SLO "https://nodejs.org/dist/v$NODE_VERSION/SHASUMS256.txt.asc" \
	&& gpg2 --batch --decrypt --output SHASUMS256.txt SHASUMS256.txt.asc \
	&& grep " node-v$NODE_VERSION-linux-x64.tar.xz\$" SHASUMS256.txt | sha256sum -c - \
	&& tar -xJf "node-v$NODE_VERSION-linux-x64.tar.xz" -C /opt/node --strip-components=1 \
	&& rm "node-v$NODE_VERSION-linux-x64.tar.xz" SHASUMS256.txt.asc SHASUMS256.txt \
	&& ln -s /opt/node/bin/node /usr/local/bin/node \
	&& ln -s /opt/node/bin/npm /usr/local/bin/npm \
	&& ln -s /opt/node/bin/npx /usr/local/bin/npx \
	&& echo "export PATH=\$PATH:/opt/node/bin" > /etc/profile.d/nodejs.sh \
    && chmod +x /etc/profile.d/*

# Fix nodejs permissions for jenkins user
RUN chown -R 10000:10000 /opt/node

USER ${USER_NAME}

RUN mkdir -p ~/workspace \
	&& mkdir -p ~/.m2/repository
