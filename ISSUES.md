								  KNOWN ISSUES
								  ~~~~~~~~~~~~

the following should capture the unrendered spaces up to the front
<p>
				[D]</p>

should be
<p>[
                 D]</p>

so that after delete() is called, we will end up with <p></p> which will be
propped to <p><br/></p>

---

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

---

there should be a way to exclude certain elements (and perhaps attributes) if
you don't want those: <em contentEditable="true" exclude="a em strong span">

---

E.g., if you run "bold" on

  <b id=x>foo[bar]baz</b>

then in Firefox 4.0 and Opera 11.10 you get <b id=x>foo</b>bar<b
id=x>baz</b> (duplicate id), in Chrome 12 dev you get <b
id=x>foo</b>bar<b>baz</b> (id lost on one element), and in IE9 you get
<strong>foo</strong>bar<strong>baz</strong> (both id's lost).  The
spec's algorithm produces <span id=x><b>foo</b>bar<b>baz</b></span>,
which I think preserves the markup about as well as you possibly
could, although of course it's a bit longer.


http://mxr.mozilla.org/mozilla-central/source/editor/libeditor/base/nsEditor.cpp#2698
