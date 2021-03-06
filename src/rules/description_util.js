// A node like "field" or "type" consists of multiple tokens.  One
// of them might be "blockstring" for the docstring for that node.
// If so we return that token, otherwise null.
function docstringToken(node) {
  for (
    let token = node.loc.startToken;
    token != node.loc.endToken;
    token = token.next
  ) {
    if (token.kind === 'BlockString' || token.kind === 'String') {
      return token;
    }
  }
  return null;
}

export function fullDescription(node) {
  // While the sdl parser exposes node.description, it sadly elides
  // leading and trailing newlines.  So I look at the source to get
  // my own version (which includes leading and trailing quotes).
  // This is hacky!
  // TODO(csilvers): figure out what source.locationOffset is.
  const token = docstringToken(node);
  if (!token) {
    return '';
  }
  return node.loc.source.body.substring(token.start, token.end);
}

// Given a node (type or field) that contains a docstring, return
// position in the document (schema file) of the offset-th byte within
// that docstring.  If offset is negative, it's taken from the end of
// the docstring.  This is used to report errors within a docstring.
// If the node does not have a docstring, or if offset is null,
// returns null.
export function offsetLocation(node, offset) {
  if (offset == null) {
    return null;
  }
  const token = docstringToken(node);
  if (!token) {
    return null;
  }

  return offset < 0 ? token.end + offset : token.start + offset;
}

// True if the given node has a blank line before it, or a line
// ending in `{`.  This calculation ignores comment lines.
export function blankLineBeforeNode(node) {
  let prevToken = node.loc.startToken.prev;
  while (prevToken && prevToken.kind === 'Comment') {
    prevToken = prevToken.prev;
  }
  return (
    !prevToken ||
    prevToken.kind === '<SOF>' || // "Start of file"
    prevToken.line < prevToken.next.line - 1 ||
    prevToken.kind === '{'
  );
}

export function descriptionIsOneLine(description) {
  return description.indexOf('\n') === -1;
}

export function leadingQuotesAreTripleQuote(descriptionWithQuotes) {
  return !!descriptionWithQuotes.match(/^"""/);
}

export function leadingQuotesOnTheirOwnLine(descriptionWithQuotes) {
  return !!descriptionWithQuotes.match(/^"""\n/);
}

export function trailingQuotesOnTheirOwnLine(descriptionWithQuotes) {
  return !!descriptionWithQuotes.match(/\n\s*"""$/);
}
