<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE xsl:stylesheet [
  <!ENTITY nbsp "&#160;">
]>        
<xsl:stylesheet version="1.0" xmlns:xsl="http://www.w3.org/1999/XSL/Transform" xmlns:ext="http://www.extjs.com">
<xsl:output method="html" indent="no"/>
    <xsl:template match="/docClass">        
        <div class="body-wrap">
            <div class="top-tools">
                <a class="inner-link" href="#{className}-props">
                <img src="resources/images/default/s.gif" class="item-icon icon-prop"/>Properties</a><xsl:text>&#x0D;</xsl:text>
                <a class="inner-link" href="#{className}-methods">
			    <img src="resources/images/default/s.gif" class="item-icon icon-method"/>Methods</a><xsl:text>&#x0D;</xsl:text>
		        <a class="inner-link" href="#{className}-events">
			    <img src="resources/images/default/s.gif" class="item-icon icon-event"/>Events</a><xsl:text>&#x0D;</xsl:text>
                <xsl:if test="cfgs">
                    <a class="inner-link" href="#{className}-configs">
                    <img src="resources/images/default/s.gif" class="item-icon icon-config"/>Config Options</a><xsl:text>&#x0D;</xsl:text>
                </xsl:if>
                <a class="bookmark" href="../docs/?class={className}">
			    <img src="resources/images/default/s.gif" class="item-icon icon-fav"/>Direct Link</a><xsl:text>&#x0D;</xsl:text>
	        </div>
            <xsl:if test="superClasses">
                <xsl:call-template name="super-classes"/>
            </xsl:if>
            <h1>Class <a href="source/{href}"><xsl:value-of select="className"/></a></h1>
            <table cellspacing="0">
                <tr>
                    <td class="label">Package:</td>
                    <td class="hd-info">
                        <xsl:choose>
                            <xsl:when test="packageName!=''"><xsl:value-of select="packageName"/></xsl:when>
                            <xsl:otherwise>Global</xsl:otherwise>
                        </xsl:choose>
                    </td>
                </tr>
                <tr><td class="label">Defined In:</td><td class="hd-info"><a href="source/{href}"><xsl:value-of select="definedIn"/></a></td></tr>
                <tr><td class="label">Class:</td><td class="hd-info"><a href="source/{href}"><xsl:value-of select="shortClassName"/></a></td></tr>
                <xsl:if test="subClasses">
                    <xsl:call-template name="sub-classes"/>
                </xsl:if>
                <tr>
                    <td class="label">Extends:</td><td class="hd-info">
                        <xsl:choose>
                            <xsl:when test="superClasses">
                                <a href="output/{superClasses[last()]/className}.html" ext:cls="{superClasses[last()]/className}" ext:member=""><xsl:value-of select="superClasses[last()]/shortClassName"/></a>
                            </xsl:when>
                            <xsl:otherwise>Object</xsl:otherwise>
                        </xsl:choose>
                    </td>
                </tr>
                <xsl:call-template name="class-custom-tags"/>    
            </table>
            <div class="description">
                <xsl:value-of select="description" disable-output-escaping="yes"/>
                <xsl:if test="singleton='true'"><br/><br/><i>This class is a singleton and cannot be created directly.</i></xsl:if>
            </div>
            <div class="hr"> </div>

            <!--Configs-->
            <xsl:if test="cfgs">
                <a id="{className}-configs"> </a>
                <h2>Config Options</h2>
                <table cellspacing="0" class="member-table">
                    <tbody>
                        <tr>
                            <th colspan="2" class="sig-header">Config Options</th>
                            <th class="msource-header">Defined By</th>
                        </tr>
                        <xsl:for-each select="cfgs">
                            <xsl:variable name="inherited">
                                <xsl:if test="/docClass/className!=className">inherited</xsl:if>
                            </xsl:variable>
                            <xsl:variable name="cls">
                                <xsl:if test="description/hasShort='true'">expandable</xsl:if>
                            </xsl:variable>
                            <tr class="config-row {$cls} {$inherited}">
                                <td class="micon"><a href="#expand" class="exi">&nbsp;</a></td>
                                <td class="sig">
                                    <a id="{className}-{name}"/>
                                    <b><a href="source/{href}"><xsl:value-of select="name"/></a></b> : <xsl:value-of select="type"/>
                                    <div class="mdesc">
                                            <xsl:choose>
                                                <xsl:when test="description/hasShort='true'">
                                                    <div class="short"><xsl:value-of select="description/shortDescr"/></div>
                                                    <div class="long"><xsl:value-of select="description/longDescr" disable-output-escaping="yes"/><xsl:call-template name="custom-tags"/></div>
                                                </xsl:when>
                                                <xsl:otherwise><xsl:value-of select="description/longDescr" disable-output-escaping="yes"/><xsl:call-template name="custom-tags"/></xsl:otherwise>
                                            </xsl:choose>
                                    </div>
                                </td>
                                  <xsl:call-template name="msource">
                                      <xsl:with-param name="inherited" select="$inherited='inherited'"/>
                                  </xsl:call-template>
                            </tr>
                        </xsl:for-each>
                    </tbody>
                </table>
            </xsl:if>

            <!--Properties-->
            <a id="{className}-props"> </a>
            <h2>Public Properties</h2>
            <xsl:choose>
                <xsl:when test="properties">
                    <table cellspacing="0" class="member-table">
                        <tbody>
                            <tr>
                                <th colspan="2" class="sig-header">Property</th>
                                <th class="msource-header">Defined By</th>
                            </tr>
                            <xsl:for-each select="properties">
                                <xsl:variable name="inherited">
                                    <xsl:if test="/docClass/className!=className">inherited</xsl:if>
                                </xsl:variable>
                                <xsl:variable name="cls">
                                    <xsl:if test="description/hasShort='true'">expandable</xsl:if>
                                </xsl:variable>
                                <tr class="property-row {$cls} {$inherited}">
                                    <td class="micon"><a href="#expand" class="exi">&nbsp;</a></td>
                                    <td class="sig">
                                        <a id="{className}-{name}"/>
                                        <b><a href="source/{href}"><xsl:value-of select="name"/></a></b> : <xsl:value-of select="type"/>
                                        <div class="mdesc">
                                            <xsl:choose>
                                                <xsl:when test="description/hasShort='true'">
                                                    <div class="short"><xsl:value-of select="description/shortDescr"/></div>
                                                    <div class="long"><xsl:value-of select="description/longDescr" disable-output-escaping="yes"/><xsl:call-template name="custom-tags"/></div>
                                                </xsl:when>
                                                <xsl:otherwise><xsl:value-of select="description/longDescr" disable-output-escaping="yes"/><xsl:call-template name="custom-tags"/></xsl:otherwise>
                                            </xsl:choose>
                                        </div>
                                    </td>
                                      <xsl:call-template name="msource">
                                          <xsl:with-param name="inherited" select="$inherited='inherited'"/>
                                      </xsl:call-template>
                                </tr>
                            </xsl:for-each>
                        </tbody>
                    </table>            
                </xsl:when>
                <xsl:otherwise><div class="no-members">This class has no public properties.</div></xsl:otherwise>
            </xsl:choose>

            <!--Methods-->
            <a id="{className}-methods"> </a>
            <h2>Public Methods</h2>
            <xsl:choose>
                <xsl:when test="methods">
                    <table cellspacing="0" class="member-table">
                        <tbody>
                            <tr>
                                <th colspan="2" class="sig-header">Method</th>
                                <th class="msource-header">Defined By</th>
                            </tr>
                            <xsl:if test="hasConstructor='true'">
                                <xsl:call-template name="constructor"/>
                            </xsl:if>                            
                            <xsl:for-each select="methods">
                                <xsl:variable name="inherited">
                                    <xsl:if test="/docClass/className!=className">inherited</xsl:if>
                                </xsl:variable>
                                <tr class="method-row expandable {$inherited}">
                                    <td class="micon"><a href="#expand" class="exi">&nbsp;</a></td>
                                    <td class="sig">
                                        <a id="{className}-{name}"/>
                                        <b><a href="source/{href}"><xsl:value-of select="name"/></a></b>
                                        <xsl:call-template name="method-params"/>:
                                        <xsl:choose>
                                            <xsl:when test="returnType"><xsl:value-of select="returnType"/></xsl:when>
                                            <xsl:otherwise>void</xsl:otherwise>
                                        </xsl:choose>
                                        <div class="mdesc">
                                            <xsl:call-template name="custom-tags"/>
                                            <div class="short">
                                                <xsl:call-template name="check-if-static"/>
                                                <xsl:value-of select="description/shortDescr"/>
                                            </div>
                                            <div class="long">
                                                <xsl:call-template name="check-if-static"/>
                                                <xsl:value-of select="description/longDescr" disable-output-escaping="yes"/>
                                                <xsl:call-template name="method-params-details"/>
                                            </div>
                                        </div>
                                    </td>
                                  <xsl:call-template name="msource">
                                      <xsl:with-param name="inherited" select="$inherited='inherited'"/>
                                  </xsl:call-template>
                                </tr>
                            </xsl:for-each>
                        </tbody>
                    </table>
                </xsl:when>
                <xsl:otherwise><div class="no-members">This class has no public methods.</div></xsl:otherwise>
            </xsl:choose>

            <!--Events-->
            <a id="{className}-events"> </a>
            <h2>Public Events</h2>
            <xsl:choose>
                <xsl:when test="events">
                  <table cellspacing="0" class="member-table">
                      <tbody>
                          <tr>
                              <th colspan="2" class="sig-header">Event</th>
                              <th class="msource-header">Defined By</th>
                          </tr>
                          <xsl:for-each select="events">
                              <xsl:variable name="inherited">
                                <xsl:if test="/docClass/className!=className">inherited</xsl:if>
                              </xsl:variable>
                              <tr class="method-row expandable {$inherited}">
                                  <td class="micon"><a href="#expand" class="exi">&nbsp;</a></td>
                                  <td class="sig">
                                      <a id="{className}-{name}"/>
                                      <b><a href="source/{href}"><xsl:value-of select="name"/></a></b> :
                                      <xsl:call-template name="method-params"/>
                                      <div class="mdesc">
                                          <div class="short"><xsl:value-of select="description/shortDescr"/></div>
                                          <div class="long">
                                              <xsl:value-of select="description/longDescr" disable-output-escaping="yes"/>
                                              <div class="mdetail-params">
                                                  <strong style="font-weight: normal;">Listeners will be called with the following arguments:</strong>
                                                  <ul>
                                                      <xsl:if test="count(params)=0">
                                                          <li>None.</li>
                                                      </xsl:if>
                                                      <xsl:for-each select="params">
                                                          <li>
                                                              <code><xsl:value-of select="name"/></code> : <xsl:value-of select="type"/>
                                                              <div class="sub-desc">
                                                                  <xsl:value-of select="description" disable-output-escaping="yes"/>
                                                              </div>
                                                          </li>
                                                      </xsl:for-each>
                                                  </ul>
                                              </div>
                                              <xsl:call-template name="custom-tags"/>
                                          </div>
                                      </div>
                                  </td>
                                  <xsl:call-template name="msource">
                                      <xsl:with-param name="inherited" select="$inherited='inherited'"/>
                                  </xsl:call-template>
                              </tr>
                          </xsl:for-each>
                      </tbody>
                  </table>
              </xsl:when>
                <xsl:otherwise><div class="no-members">This class has no public events.</div></xsl:otherwise>
            </xsl:choose>
            
        </div>
    </xsl:template>

    <!-- Right column with link to parent class -->
    <xsl:template name="msource">
        <xsl:param name="inherited"/>
        <td class="msource">
              <xsl:choose>
                    <xsl:when test="$inherited">
                        <a href="output/{className}.html#{name}" ext:member="#{name}" ext:cls="{className}">
                            <xsl:value-of select="shortClassName"/>
                        </a>
                    </xsl:when>
                    <xsl:otherwise>
                        <xsl:value-of select="shortClassName"/>
                    </xsl:otherwise>
                </xsl:choose>
          </td>
    </xsl:template>

    <xsl:template name="constructor">
       <tr class="method-row expandable">
            <td class="micon"><a href="#expand" class="exi">&nbsp;</a></td>
            <td class="sig">
                <a id="{className}-{shortClassName}"/>
                <b><a href="source/{href}"><xsl:value-of select="shortClassName"/></a></b>
                <xsl:call-template name="method-params"/>
                <div class="mdesc">
                    <div class="short"><xsl:value-of select="constructorDescription/shortDescr"/></div>
                    <div class="long">
                        <xsl:value-of select="constructorDescription/longDescr" disable-output-escaping="yes"/>
                        <xsl:call-template name="method-params-details"/>
                        <xsl:call-template name="custom-tags"/>
                    </div>
                </div>
            </td>
          <xsl:call-template name="msource">
              <xsl:with-param name="inherited" select="false()"/>
          </xsl:call-template>
        </tr>
    </xsl:template>

    <!-- Method Parameters in short-->
    <xsl:template name="method-params">(<xsl:if test="count(params)&gt;0">&nbsp;</xsl:if><xsl:for-each select="params">
            <xsl:choose>
                <xsl:when test="optional='true'"><span title="Optional" class="optional">[<code><xsl:value-of select="type"/>&nbsp;<xsl:value-of select="name"/></code>]</span></xsl:when>
                <xsl:otherwise><code><xsl:value-of select="type"/>&nbsp;<xsl:value-of select="name"/></code></xsl:otherwise>
            </xsl:choose>
            <xsl:if test="position()!=last()">,&nbsp;</xsl:if>
        </xsl:for-each><xsl:if test="count(params)&gt;0">&nbsp;</xsl:if>)
    </xsl:template>



    <!-- Method Parameters processing-->
    <xsl:template name="method-params-details">
        <div class="mdetail-params">
            <strong>Parameters:</strong>
            <ul>
                <xsl:if test="count(params)=0">
                    <li>None.</li>
                </xsl:if>
                <xsl:for-each select="params">
                    <li>
                        <code><xsl:value-of select="name"/></code> : <xsl:value-of select="type"/>
                        <div class="sub-desc"><xsl:value-of select="description" disable-output-escaping="yes"/></div>
                    </li>
                </xsl:for-each></ul>
            <strong>Returns:</strong>
            <ul>
                <li>
                    <xsl:choose>
                        <xsl:when test="returnType">
                            <code><xsl:value-of select="returnType"/></code>
                            <div class="sub-desc"><xsl:value-of select="returnDescription"/></div>
                        </xsl:when>
                        <xsl:otherwise>void</xsl:otherwise>
                    </xsl:choose>
                </li>
            </ul>
        </div>
    </xsl:template>

    <!-- Shows <static> if item is static-->
    <xsl:template name="check-if-static">
        <xsl:if test="isStatic='true'">&lt;static&gt;&nbsp;</xsl:if>    
    </xsl:template>

    <!-- Shows inheritance tree in the right side -->
    <xsl:template name="super-classes">
        <div class="inheritance res-block">
            <pre class="res-block-inner">
                <xsl:for-each select="superClasses">
                    <a href="output/{className}.html" ext:member="" ext:cls="{className}"><xsl:value-of select="shortClassName"/></a><xsl:text>&#x0D;</xsl:text>
                    <xsl:call-template name="spacer">
                        <xsl:with-param name="n" select="position()"/>
                    </xsl:call-template>
                    <img src="resources/elbow-end.gif"/>
                </xsl:for-each>
                <xsl:value-of select="shortClassName"/>
            </pre>
        </div>
    </xsl:template>

    <!-- Recursive template generates "n" number of space elements -->
    <xsl:template name="spacer">        
        <xsl:param name="n"/>
        <xsl:if test="$n&gt;0">
            <xsl:text>&nbsp;&nbsp;</xsl:text>
            <xsl:call-template name="spacer">
                <xsl:with-param name="n" select="$n - 1"/>
            </xsl:call-template>
        </xsl:if>
    </xsl:template>

    <!-- Shows subclasses -->
    <xsl:template name="sub-classes">
        <tr>
            <td class="label">Subclasses:</td>
            <td class="hd-info">
                <xsl:for-each select="subClasses">
                    <a href="output/{className}.html" ext:cls="{className}"><xsl:value-of select="shortClassName"/></a>
                    <xsl:if test="position()!=last()"><xsl:text>,&#x0D;</xsl:text></xsl:if>
                </xsl:for-each>
            </td>
        </tr>
    </xsl:template>

    <xsl:template name="class-custom-tags">
        <xsl:if test="customTags">
            <xsl:for-each select="customTags">
            <tr>
                <td class="label"><xsl:value-of select="title"/>:</td>
                <td class="hd-info"><xsl:value-of select="value" disable-output-escaping="yes"/></td>
            </tr>
            </xsl:for-each>
        </xsl:if>
    </xsl:template>

    <xsl:template name="custom-tags">
        <xsl:if test="customTags">
            <table>
                <xsl:for-each select="customTags">
                    <tr>
                        <td class="label"><xsl:value-of select="title"/>:</td>
                        <td class="hd-info"><xsl:value-of select="value" disable-output-escaping="yes"/></td>
                    </tr>
                </xsl:for-each>
            </table>
        </xsl:if>
    </xsl:template>

</xsl:stylesheet>
