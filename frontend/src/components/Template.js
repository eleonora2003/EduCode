export default function Template() {
  return (
    <div className="page-content">
      <div className="page-header">
        <div>
          <h2>Template Editor</h2>
          <p>Create and customize task templates</p>
        </div>
        <button className="btn-primary">💾 Save Template</button>
      </div>

      <div className="form-card">
        <div className="form-group">
          <label>Template Name</label>
          <input
            type="text"
            placeholder="e.g. Advanced Algorithm Challenge"
          />
        </div>

        <div className="form-group">
          <label>Programming Language</label>
          <select>
            <option>Python</option>
            <option>Java</option>
            <option>JavaScript</option>
          </select>
        </div>

        <div className="form-group">
          <label>Learning Goals</label>
          <textarea placeholder="Define the learning objectives for this template..."></textarea>
          <div className="tags">
            <span className="tag">Understanding loops</span>
            <span className="tag">Algorithm optimization</span>
            <span className="tag-add">+ Add goal</span>
          </div>
        </div>

        <div className="form-group">
          <label>Restrictions</label>
          <textarea placeholder="Specify any constraints or limitations..."></textarea>
          <div className="tags">
            <span className="tag">No built-in functions</span>
            <span className="tag">O(n) time complexity</span>
            <span className="tag-add">+ Add restriction</span>
          </div>
        </div>

        <div className="form-group">
          <label>Code Structure Template</label>
          <pre>def solution(input_data):
    """
    TODO: Implement your solution here
    """
    pass</pre>
        </div>
      </div>

      <div className="templates-list">
        <h3>Existing Templates</h3>
        <div className="template-item">
          <div>
            <h4>Default Template</h4>
            <p>Python • 24 tasks generated</p>
          </div>
          <button className="btn-edit">Edit</button>
        </div>
        <div className="template-item">
          <div>
            <h4>Algorithm Challenge</h4>
            <p>Python • 18 tasks generated</p>
          </div>
          <button className="btn-edit">Edit</button>
        </div>
      </div>
    </div>
  );
}