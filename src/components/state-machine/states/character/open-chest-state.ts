import * as Phaser from 'phaser';
import { BaseCharacterState } from './base-character-state';
import { CHARACTER_STATES } from './character-states';
import { CharacterGameObject } from '../../../../game-objects/common/character-game-object';
import { Chest } from '../../../../game-objects/objects/chest';
import { CUSTOM_EVENTS, EVENT_BUS } from '../../../../common/event-bus';
import { SCENE_KEYS } from '../../../../scenes/scene-keys';
import { ASSET_KEYS } from '../../../../common/assets';

export class OpenChestState extends BaseCharacterState {
  constructor(gameObject: CharacterGameObject) {
    super(CHARACTER_STATES.OPEN_CHEST_STATE, gameObject);
  }

  onEnter(args: unknown[]): void {
    const chest = args[0] as Chest;

    // make character invulnerable so we can collect the item
    this._gameObject.invulnerableComponent.invulnerable = true;

    // reset game object velocity
    this._resetObjectVelocity();

    // pick a random question and route to the right scene
    const qcmQuestions = this._gameObject.scene.cache.json.get(ASSET_KEYS.QCM) as { type?: string }[];
    const question = Phaser.Utils.Array.GetRandom(qcmQuestions);

    if (question.type === 'drag_drop') {
      this._gameObject.scene.scene.launch(SCENE_KEYS.DRAG_DROP_SCENE, { question });
    } else {
      this._gameObject.scene.scene.launch(SCENE_KEYS.QUIZ_SCENE);
    }

    // listen for quiz result
    EVENT_BUS.once(CUSTOM_EVENTS.QUIZ_RESULT, (data: { correct: boolean }) => {
      if (data.correct) {
        // if answer is correct, open the chest and play animation
        chest.open();
        this._gameObject.animationComponent.playAnimation(`LIFT_${this._gameObject.direction}`, () => {
          // emit event data regarding chest
          EVENT_BUS.emit(CUSTOM_EVENTS.OPENED_CHEST, chest);
          // after showing message to player, transition to idle state
          EVENT_BUS.once(CUSTOM_EVENTS.DIALOG_CLOSED, () => {
            // make character vulnerable so we can take damage
            this._gameObject.invulnerableComponent.invulnerable = false;
            this._stateMachine.setState(CHARACTER_STATES.IDLE_STATE);
          });
        });
      } else {
        // if answer is wrong, go back to idle state
        this._gameObject.invulnerableComponent.invulnerable = false;
        this._stateMachine.setState(CHARACTER_STATES.IDLE_STATE);
      }
    });
  }
}
