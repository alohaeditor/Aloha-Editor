<?xml version="1.0" encoding="UTF-8"?>
<xsl:stylesheet version="1.0" xmlns:xsl="http://www.w3.org/1999/XSL/Transform">
	<xsl:output method="text"/>

	<xsl:template match="/">
		Docs.classData ={"id":"apidocs","iconCls":"icon-docs","text":"API Documentation","singleClickExpand":true,"children":[<xsl:apply-templates/>]};
        Docs.icons = {
        <xsl:for-each select="//classes">
			<xsl:variable name="icon">
                    <xsl:choose>
                        <xsl:when test="singleton='true'">icon-static</xsl:when>
                        <xsl:when test="component='true'">icon-cmp</xsl:when>
                        <xsl:otherwise>icon-cls</xsl:otherwise>
                    </xsl:choose>
                </xsl:variable>
			"<xsl:value-of select="className"/>":"<xsl:value-of select="$icon"/>"
			<xsl:if test="position()!=last()">,</xsl:if>
        </xsl:for-each>};
    </xsl:template>

	<xsl:template match="treePackage|packages">
		<xsl:for-each select="packages">
                {"id":"pkg-<xsl:value-of select="@fullName"/>","text":"<xsl:value-of select="@name"/>","iconCls":"icon-pkg","cls":"package","singleClickExpand":true, children:[<xsl:apply-templates select="."/>]}
				<xsl:if test="position()!=last()">,</xsl:if>
			</xsl:for-each>
			<xsl:if test="count(packages)!=0 and count(classes)!=0">,</xsl:if>
			<xsl:for-each select="classes">			
                <xsl:variable name="icon">
                    <xsl:choose>
                        <xsl:when test="singleton='true'">icon-static</xsl:when>
                        <xsl:when test="component='true'">icon-cmp</xsl:when>
                        <xsl:otherwise>icon-cls</xsl:otherwise>
                    </xsl:choose>
                </xsl:variable>
                {"href":"output/<xsl:value-of select="className"/>.html","text":"<xsl:value-of select="shortClassName"/>","id":"<xsl:value-of select="className"/>","isClass":true,"iconCls":"<xsl:value-of select="$icon"/>","cls":"cls","leaf":true}
				<xsl:if test="position()!=last()">,</xsl:if>
			</xsl:for-each>
    </xsl:template>

	<!--suppress default templates-->
	<xsl:template match="*"/>


</xsl:stylesheet>

