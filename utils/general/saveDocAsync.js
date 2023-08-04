// to save document asynchronously or synchronously based on given boolean
module.exports = async function saveDocAsync(doc, async) {
    // asynchronously save document (cache updated successfully)
    if (async) {
        doc.save();
    }
    // otherwise if cache is not updated then synchronously save document
    else {
        await doc.save();
    }
}