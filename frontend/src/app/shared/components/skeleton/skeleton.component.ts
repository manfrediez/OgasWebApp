import { Component, input } from '@angular/core';

@Component({
  selector: 'app-skeleton',
  standalone: true,
  template: `
    @switch (variant()) {
      @case ('stat') {
        <div class="card-glass rounded-2xl p-5 animate-pulse">
          <div class="flex items-center gap-3 mb-2">
            <div class="h-10 w-10 rounded-xl bg-primary-200"></div>
            <div class="h-3 w-24 bg-primary-200 rounded"></div>
          </div>
          <div class="h-8 w-16 bg-primary-200 rounded mt-2"></div>
        </div>
      }
      @case ('card') {
        <div class="card-glass rounded-2xl p-5 animate-pulse">
          <div class="flex items-center gap-3 mb-3">
            <div class="h-11 w-11 rounded-full bg-primary-200"></div>
            <div class="flex-1 space-y-2">
              <div class="h-4 w-32 bg-primary-200 rounded"></div>
              <div class="h-3 w-48 bg-primary-200 rounded"></div>
            </div>
          </div>
          <div class="h-10 bg-primary-200 rounded-xl mb-3"></div>
          <div class="flex justify-between pt-3 border-t border-primary-50">
            <div class="h-3 w-28 bg-primary-200 rounded"></div>
            <div class="h-5 w-16 bg-primary-200 rounded-full"></div>
          </div>
        </div>
      }
      @case ('table-row') {
        <tr class="animate-pulse">
          <td class="px-6 py-4">
            <div class="flex items-center gap-3">
              <div class="w-9 h-9 rounded-full bg-primary-200"></div>
              <div class="space-y-2">
                <div class="h-4 w-32 bg-primary-200 rounded"></div>
                <div class="h-3 w-40 bg-primary-200 rounded"></div>
              </div>
            </div>
          </td>
          <td class="px-4 py-4 text-center">
            <div class="h-8 w-8 rounded-full bg-primary-200 mx-auto"></div>
          </td>
          <td class="px-4 py-4">
            <div class="flex items-center justify-center gap-2">
              <div class="h-3 w-6 bg-primary-200 rounded"></div>
              <div class="w-20 h-2 bg-primary-200 rounded-full"></div>
            </div>
          </td>
          <td class="px-4 py-4">
            <div class="space-y-1">
              <div class="h-4 w-24 bg-primary-200 rounded"></div>
              <div class="h-3 w-32 bg-primary-200 rounded"></div>
            </div>
          </td>
          <td class="px-4 py-4 text-center">
            <div class="h-7 w-20 bg-primary-200 rounded-lg mx-auto"></div>
          </td>
        </tr>
      }
      @case ('text-block') {
        <div class="animate-pulse space-y-3">
          <div class="h-4 w-3/4 bg-primary-200 rounded"></div>
          <div class="h-4 w-full bg-primary-200 rounded"></div>
          <div class="h-4 w-2/3 bg-primary-200 rounded"></div>
        </div>
      }
      @case ('greeting') {
        <div class="rounded-2xl bg-primary-50 border border-primary-200 px-6 py-6 animate-pulse">
          <div class="h-3 w-24 bg-primary-200 rounded"></div>
          <div class="h-7 w-40 bg-primary-200 rounded mt-2"></div>
          <div class="h-3 w-48 bg-primary-200 rounded mt-2"></div>
        </div>
      }
      @case ('session') {
        <div class="card-glass-static rounded-2xl p-5 md:p-6 border-l-4 border-l-primary-200 animate-pulse">
          <div class="h-5 w-40 bg-primary-200 rounded mb-4"></div>
          <div class="space-y-3">
            <div class="flex items-center gap-2">
              <div class="h-6 w-6 bg-primary-200 rounded"></div>
              <div class="h-4 w-24 bg-primary-200 rounded"></div>
            </div>
            <div class="h-4 w-full bg-primary-200 rounded"></div>
            <div class="h-4 w-2/3 bg-primary-200 rounded"></div>
            <div class="flex gap-2">
              <div class="h-7 w-20 bg-primary-200 rounded-full"></div>
              <div class="h-7 w-20 bg-primary-200 rounded-full"></div>
            </div>
          </div>
        </div>
      }
      @case ('month-summary') {
        <div class="card-glass-static rounded-2xl p-5 md:p-6 animate-pulse">
          <div class="h-5 w-36 bg-primary-200 rounded mb-4"></div>
          <div class="h-3 bg-primary-200 rounded-full mb-4"></div>
          <div class="grid grid-cols-3 gap-2 mb-4">
            @for (_ of [1,2,3]; track $index) {
              <div class="text-center p-3 bg-primary-50 rounded-xl border border-primary-200">
                <div class="h-8 w-10 bg-primary-200 rounded mx-auto mb-1"></div>
                <div class="h-3 w-16 bg-primary-200 rounded mx-auto"></div>
              </div>
            }
          </div>
        </div>
      }
      @case ('conversation') {
        <div class="card-glass rounded-xl p-5 animate-pulse">
          <div class="flex items-center gap-3">
            <div class="h-10 w-10 rounded-full bg-primary-200"></div>
            <div class="flex-1 space-y-2">
              <div class="h-4 w-28 bg-primary-200 rounded"></div>
              <div class="h-3 w-44 bg-primary-200 rounded"></div>
              <div class="h-2 w-16 bg-primary-200 rounded"></div>
            </div>
          </div>
        </div>
      }
    }
  `,
})
export class SkeletonComponent {
  variant = input<'stat' | 'card' | 'table-row' | 'text-block' | 'greeting' | 'session' | 'month-summary' | 'conversation'>('card');
}
