								  KNOWN ISSUES
								  ~~~~~~~~~~~~

delete the given selection should not be a noop.

<ul><li>{</li></ul>
<div>}
	<ul>
		<li>one</li>
		<li>two</li>
		<li>three<ul>
					<li>one</li>
					<li>two</li>
					<li>three</li>
				</ul>
		</li>
	</ul>
</div>


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



