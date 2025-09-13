import { getVersion } from '@tiptap/pm/collab';
import { Step } from '@tiptap/pm/transform';
import { receiveTransaction } from '@tiptap/pm/collab';

export type CommState = 'start' | 'poll' | 'send' | 'recover';

export class EditorConnection {
  private socket: any;
  private docId: string;
  private clientID: number;
  private state: CommState;
  private backOff: number;
  private editor: any;
  private isReceiving: boolean = false;
  private isReceivingRef: React.MutableRefObject<boolean>;
  private onVersionChange: (version: number) => void;
  private onContentChange: (content: any) => void;

  constructor(
    socket: any, 
    docId: string, 
    editor: any, 
    isReceivingRef: React.MutableRefObject<boolean>,
    onVersionChange: (version: number) => void,
    onContentChange: (content: any) => void,
    clientID: number
  ) {
    this.socket = socket;
    this.docId = docId;
    this.clientID = clientID;
    this.state = 'start';
    this.backOff = 0;
    this.editor = editor;
    this.isReceivingRef = isReceivingRef;
    this.onVersionChange = onVersionChange;
    this.onContentChange = onContentChange;
    this.start();
  }

  start() {
    console.log('🔧 Starting collaboration connection...');
    this.state = 'poll';
    this.poll();
  }

  poll() {
    if (this.state !== 'poll' || !this.editor) return;
    
    const version = getVersion(this.editor.state);
    console.log(`🔄 Polling for updates from version ${version}`);
    
    this.socket.emit('pullUpdates', {
      docId: this.docId,
      version: version
    });
  }

  send(steps: any[]) {
    if (!this.editor || this.isReceiving) return;
    
    this.state = 'send';
    const version = getVersion(this.editor.state);
    
    console.log(`📤 Sending ${steps.length} steps from version ${version}`);
    
    this.socket.emit('pushUpdates', {
      docId: this.docId,
      version: version,
      steps: steps.map(s => s.toJSON()),
      clientID: this.clientID
    });
  }

  handlePullResponse(data: any) {
    if (data.error) {
      console.error('❌ Pull error:', data.error);
      this.recover();
      return;
    }

    if (data.steps && data.steps.length > 0 && this.editor && !this.isReceiving) {
      console.log(`📥 Received ${data.steps.length} steps`);
      
      this.isReceiving = true;
      this.isReceivingRef.current = true;
      
      try {
        // **FIXED**: Simplified step application with better error handling
        let appliedCount = 0;
        
        for (let i = 0; i < data.steps.length; i++) {
          try {
            const stepData = data.steps[i];
            const step = Step.fromJSON(this.editor.schema, stepData);
            
            // **FIXED**: Try to apply step and catch validation errors
            try {
              const tr = receiveTransaction(this.editor.state, [step], [stepData.clientID || 0]);
              this.editor.view.dispatch(tr);
              appliedCount++;
            } catch (positionError) {
              const errorMsg = (positionError instanceof Error) ? positionError.message : String(positionError);
              console.warn(`⚠️ Skipping invalid step ${i}: position error -`, errorMsg);
              // If we hit position errors, request resync
              if (errorMsg.includes('out of range') || errorMsg.includes('Position')) {
                this.resyncDocument();
                break;
              }
            }
          } catch (stepError) {
            console.error(`❌ Error parsing step ${i}:`, stepError);
            continue;
          }
        }
        
        if (appliedCount > 0) {
          const newVersion = getVersion(this.editor.state);
          console.log(`✅ Applied ${appliedCount}/${data.steps.length} steps, version updated: ${newVersion}`);
          this.updateVersionDisplay();
          this.saveContent();
        }
        
      } catch (error) {
        console.error('❌ Error in step application:', error);
        this.resyncDocument();
      } finally {
        setTimeout(() => {
          this.isReceiving = false;
          this.isReceivingRef.current = false;
        }, 100);
      }
    }

    // Continue polling
    if (this.state === 'poll' || this.state === 'send') {
      this.state = 'poll';
      const delay = (data.steps && data.steps.length > 0) ? 500 : 2000;
      setTimeout(() => this.poll(), delay);
    }
  }

  // **FIXED**: Simplified resync without complex validation
  private resyncDocument() {
    console.log('🔄 Requesting full document resync...');
    
    // Request all steps from version 0
    this.socket.emit('pullUpdates', {
      docId: this.docId,
      version: 0,
      forceResync: true
    });
  }

  handlePushResponse(data: any) {
    if (data.error) {
      console.error('❌ Push error:', data.error, 'Expected version:', data.expectedVersion);
      
      if (data.error === 'Invalid version') {
        console.log('🔄 Version mismatch detected, pulling latest updates...');
        this.state = 'poll';
        this.poll();
        return;
      }
      
      this.state = 'poll';
      this.poll();
      return;
    }

    console.log(`✅ Steps confirmed at version ${data.version}`);
    this.updateVersionDisplay();
    this.saveContent();
    
    this.state = 'poll';
    this.poll();
  }

  private saveContent() {
    if (this.editor && this.onContentChange) {
      const content = this.editor.getJSON();
      this.onContentChange(content);
    }
  }

  private updateVersionDisplay() {
    if (this.editor) {
      const currentVersion = getVersion(this.editor.state);
      this.onVersionChange(currentVersion);
      console.log(`📊 Version display updated to: ${currentVersion}`);
    }
  }

  recover() {
    console.log('🔄 Recovering connection...');
    this.state = 'recover';
    this.backOff = Math.min((this.backOff || 200) * 2, 6000);
    
    setTimeout(() => {
      if (this.state === 'recover') {
        this.state = 'poll';
        this.poll();
      }
    }, this.backOff);
  }

  close() {
    console.log('🛑 Closing collaboration connection');
  }
}
