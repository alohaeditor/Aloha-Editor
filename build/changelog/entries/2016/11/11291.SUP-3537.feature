h2. added wrapping div element for tables for responsive tables

Create responsive tables by wrapping table-elements created by Aloha-Editor in a div-element with a configurable class to make them scroll horizontally on small devices.
This follows the example giving by "Twitter Bootstrap":http://getbootstrap.com/css/#tables-responsive

h3. Configuration Example

<pre>
// enable the wrapping div-element and set the class to 'responsive-table'
table.settings.wrapClass = 'responsive-table';
</pre>

h3. Output Example

<pre>
<div class="responsive-table">
    <table>
        ...
    </table>
</div>
</pre>
