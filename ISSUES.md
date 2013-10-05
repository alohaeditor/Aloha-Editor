								  KNOWN ISSUES
								  ~~~~~~~~~~~~


expandToVisible:
foo  []  bar ==> foo [   ]bar
   --  --           - ---


to tests:
editing.delete()
fo[o
<ul>
<li>ba]r</li>
</ul>

"ba" should get transfered to be before the ul


double clicking on a first paragraphs leads to this wierd selection:
<p>
	[Lorem ipsum dolor sit amet, <b>consec<i>tet</i>ur</b> adipiscing
	elit. Donec a diam lectus. Sed sit amet ipsum mauris.  Maecenas
	congue ligula ac quam viverra nec consectetur ante hendrerit.
</p>
<ul>
	<li>}one</li>
	<li>two</li>
	<li>three</li>
</ul>



