								  KNOWN ISSUES
								  ~~~~~~~~~~~~

Figure out how to behave if editing host is an inline element (2011)

http://lists.w3.org/Archives/Public/public-webapps/2011OctDec/0553.html

----


is we don't use content editable, it is possible to select content across and
beyond the editing host. EG: CTRL+A

---

TODO: https://dvcs.w3.org/hg/editing/raw-file/tip/editing.html#toggling-lists

---

the following should capture the unrendered spaces up to the front
<p>
				[D]</p>

should be
<p>[
                 D]</p>

so that after delete() is called, we will end up with <p></p> which will be
propped to <p><br/></p>

---

double clicking on a first paragraphs leads to this selection, which while
correct, is nevertheless a little wierd:
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

http://mxr.mozilla.org/mozilla-central/source/editor/libeditor/base/nsEditor.cpp#2698
