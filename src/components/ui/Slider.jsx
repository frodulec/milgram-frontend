import React from 'react';
import * as SliderPrimitive from '@radix-ui/react-slider';
import './slider.css';

const Slider = React.forwardRef(({
    value,
    onValueChange,
    min = 0,
    max = 100,
    step = 1,
    disabled = false,
    className = '',
    colorMode = 'light',
    ...props
}, ref) => {
    return (
        <SliderPrimitive.Root
            ref={ref}
            className={`slider-root ${className}`}
            value={value}
            onValueChange={onValueChange}
            min={min}
            max={max}
            step={step}
            disabled={disabled}
            {...props}
        >
            <SliderPrimitive.Track className="slider-track">
                <SliderPrimitive.Range className="slider-range" />
            </SliderPrimitive.Track>
            {Array.isArray(value) ? (
                value.map((_, index) => (
                    <SliderPrimitive.Thumb
                        key={index}
                        className="slider-thumb"
                        data-color-mode={colorMode}
                    />
                ))
            ) : (
                <SliderPrimitive.Thumb
                    className="slider-thumb"
                    data-color-mode={colorMode}
                />
            )}
        </SliderPrimitive.Root>
    );
});

Slider.displayName = 'Slider';

export default Slider;
