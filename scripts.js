$.fn.serializeObject = function () {
    var o = {};
    var a = this.serializeArray();
    $.each(a, function () {
        if (o[this.name] !== undefined) {
            if (!o[this.name].push) {
                o[this.name] = [o[this.name]];
            }
            o[this.name].push(this.value || '');
        } else {
            o[this.name] = this.value || '';
        }
    });
    return o;
};

if ($(".scroll").length > 0) {
    $(window).load(function () {
        $(".scroll").mCustomScrollbar({ axis: "y", autoHideScrollbar: true, advanced: { autoScrollOnFocus: false } });
    });
}


$(document).ready(function () {
    // LAYOUT
    function adjustTwoColumns() {
        $sidebar.css('min-height', 0);
        $mainColumn.css('min-height', 0);
        var height = $mainColumn.height() > $sidebar.height() ? $mainColumn.height() : $sidebar.height();
        $sidebar.css('min-height', height);
        $mainColumn.css('min-height', height);
        if (window.innerWidth >= 992) {
            $container.css('height', height);
        } else {
            $container.css('height', 'auto');
        }

        setTimeout(function () {
            $sidebar.find('.sidebar').stick_in_parent();
        }, 1);

    }

    var isTwoColumns = $('.column-main').length > 0 && $('.column-sidebar').length > 0;
    if (isTwoColumns) {
        var $mainColumn = $('.column-main');
        var $sidebar = $('.column-sidebar');
        var $container = $('.btm-main');
        adjustTwoColumns();
        $(window).resize(function () {
            adjustTwoColumns();
        });

        $(window).load(function () {
            $(window).resize();
            setTimeout(function () { $(window).resize(); }, 500);
        });
    }

    var $header = $('.header');
    if ($header.length > 0) {
        var $w = $(window);
        var top = 0;
        var topBefore = 0;
        var headerHeight = $header.height();
        var isFixed = false;

        $w.scroll(function () {
            topBefore = $w.data('top') || 0;
            top = $w.scrollTop();
            isFixed = $header.hasClass('header-fixed');
            $w.data('top', top);

            if (top <= 20) {
                if (isFixed) {
                    $header.removeClass('header-fixed');
                    $header.css({ 'transform': 'translateY(0px)' });
                }
            } else if (top >= headerHeight * 2) {
                if (top > topBefore) {
                    $header.css({ 'transform': 'translateY(-' + headerHeight + 'px)' });
                } else {
                    $header.addClass('header-fixed');
                    $header.css({ 'transform': 'translateY(0px)' });
                }
            }
        });
    }

    function toggleMenu() {
        var $body = $('html, body');
        if ($body.hasClass('opened')) {
            $body.removeClass('opened');
            $('.body-layer').remove();
        } else {
            $body.addClass('opened');
            var $layer = $('<div>').addClass('body-layer').click(toggleMenu);
            $('.main-wrapper').append($layer);
        }
    }

    $('.show-menu').click(function () {
        toggleMenu();
    });

    $('body').on('click', '.close-bar', function () {
        toggleMenu();
    });

    // GENERAL WORKS PAGE
    $('.more-works').click(function () {
        var $button = $(this);
        $button.button('loading');
        var start = $('.work-item').length;
        $.get(baseUrl + '/works/more/' + start, function (res) {
            if (res.status == 1 || res.status == 2) {
                var $items = $(res.html).css('display', 'none');
                $('.work-wrapper').append($items);
                showElements($items);
                if (res.status == 2)
                    $button.hide(400);
            } else if (res.status == -1) {
                $button.hide(400);
            } else {
                alert('Server error');
            }
            $button.button('reset');
        }, 'JSON');
    });

    function showElements($elements) {
        var animationTime = 300;
        $elements.each(function (num) {
            var $item = $(this);
            setTimeout(function () {
                $item.show(animationTime);
            }, num * animationTime / 3);
        });
    }

    // CONTACTS PAGE
    if ($('.contact-form').length > 0) {
        // SET first option disabled in contacts form
        /*$('.contact-form select option:first-child').prop({
            'disabled': 'disabled',
            'selected': 'selected'
        });*/

        $('.contact-form form').submit(function () {
            return sendRequest($(this), 'contacts');
        });

        function showErrors(errors, $block) {
            if (!errors)
                return;
            var $content = $block.find('.alert-text');
            $content.html('');
            for (var k = 0, l = errors.length; k < l; ++k) {
                $content.append((k + 1) + '. ' + errors[k] + '<br>');
            }
            $block.show(500);
        }
    }


    function sendRequest($this, type, extra) {
        if (!$this.valid())
            return false;
        var $button = $this.find('[type="submit"]');
        $button.button('loading');
        $this.find('.alert').hide();

        var data = $this.serializeObject();
        if (!!type)
            data.type = type;
        if (!!extra) {
            data.message = JSON.stringify({
                message: data.message,
                extra: extra
            });
        }

        $.ajax({
            url: baseUrl + '/contacts',
            data: data,
            type: 'POST',
            dataType: 'JSON',
            success: function (res) {
                if (res.valid) {
                    $this.find('.alert-success').show(500, function () {
                        if (type == 'requests') {
                            setTimeout(function () {
                                $this.closest('.modal-dialog').find('.close').trigger('click');
                            }, 5000);
                        }
                    });
                    $this[0].reset();
                } else {
                    showErrors(res.errors, $this.find('.alert-danger'));
                }
                $button.button('reset');
            },
            error: function () {
                $button.button('reset');
            }
        });

        return false;
    }


    // PRICES PAGE
    $('.spinner').on('click', '.quantity-btn', function () {
        var isPlus = $(this).hasClass('plus');
        var $spinner = $(this).closest('.spinner');
        var $input = $spinner.find('.quantity-chosen');
        var value = parseInt($input.val());
        if (isNaN(value))
            value = 0;
        value = isPlus ? value + 1 : value - 1;
        if (value < 0)
            value = 0;
        $input.val(value).trigger('change');
    });

    $('.quantity-chosen, .order-quantity input[type="checkbox"]').change(
        calculatePrice);

    function calculatePrice() {
        var sum = 0;
        var minTime = 0;
        var maxTime = 0;
        //var $prices = $('.prices .prices-table .price-row');
        var $tables = $('.prices .prices-table');
        $tables.each(function (num) {
            var tableSum = 0;
            var tableQty = 0;
            var tablePercent = 100;
            var tableMinTime = 0;
            var tableMaxTime = 0;
            var tableMinQtyTime = 0;
            var tableMaxQtyTime = 0;
            $(this).find('.price-row').each(function () {
                var price = $(this).find('.cost').data('price');
                var time = $(this).find('.time').data('time');
                var arr = time.toString().split('-');
                var min = parseInt(arr[0]);
                var max = min;
                if (arr.length > 1)
                    max = parseInt(arr[1]);

                if ($(this).find('.quantity-chosen').length > 0) {
                    var qty = parseInt($(this).find('.quantity-chosen').val());
                    if (qty > 0) {
                        tableQty += qty;
                        tableSum += price * qty;
                        tableMinTime += min * qty;
                        tableMaxTime += max * qty;
                    }
                } else if ($(this).find(
                    '.order-quantity input[type="checkbox"]').is(
                        ':checked')) {
                    tablePercent += $(this).find('.cost').data('percent');
                    tableMinQtyTime += min;
                    tableMaxQtyTime += max;
                }
            });

            if (tableSum > 0)
                tableSum = Math.round(tableSum * tablePercent / 100);

            if (tableMinTime > 0) {
                tableMinTime = tableMinTime + tableQty * tableMinQtyTime;
                tableMaxTime = tableMaxTime + tableQty * tableMaxQtyTime;
            }

            minTime += tableMinTime;
            maxTime += tableMaxTime;
            sum += tableSum;
        });

        $('.total-sum').prop('number', $('.total-sum').first().text()).
            animateNumber({ number: sum });
        if (minTime == maxTime) {
            $('.total-time').prop('number', parseInt($('.total-time').first().
                text()) || 0)
                .animateNumber({ number: minTime });
        } else {
            if ($('.total-time .min').length <= 0)
                $('.total-time').html(
                    '<span class="min">0</span> - <span class="max">0</span>');

            $('.total-time .min').prop('number', $('.total-time .min').text())
                .animateNumber({ number: minTime });
            $('.total-time .max').prop('number', $('.total-time .max').text())
                .animateNumber({ number: maxTime });
        }

    }

    $('select.job-type, select.job-budget').on('change', function () {
        var type = $('select.job-type').val();
        var budget = $('select.job-budget').val();
        showApplicant(type, budget);
    });

    $('html').on('click', '.jq-selectbox li', function () {
        var type = $('select.job-type').val();
        var budget = $('select.job-budget').val();
        showApplicant(type, budget);
    });

    function showApplicant(type, budget) {
        if (type && budget && type.length > 0 && budget.length > 0 && type != '0' && budget != '0') {
            $('#myModal').modal('show');
            $('.total-sum').text(budget);
            $('.pop-up-content form').off('submit').on('submit', function () {
                var subject = type + ' project with budget ' + budget + ' was requested.'
                var $form = $('.pop-up-content form');
                $form.find('[name="subject"]').val(subject);

                return sendRequest($(this), 'requests', {
                    type: type,
                    budget: budget
                });
            });
        }
    }


    $('.pop-up-content form').submit(function () {
        var hasDiscount = $('#discount').is(':checked');
        var subject = 'Project with budget ' + $('.total-sum').first().text()
            + '$ for time ' + $('.total-time').first().text() + ' days. ';
        subject += hasDiscount ? "It's Startup." : '';
        $(this).find('[name="subject"]').val(subject);
        var prices = [];
        $('.price-row').each(function () {
            var isActive = $(this).find('.quantity-chosen').val() > 0
                || $(this).find('.order-quantity input[type="checkbox"]').
                    is(':checked');
            if (isActive) {
                var $row = $(this);
                prices.push({
                    id: $row.data('id'),
                    qty: $row.find('.quantity-chosen').length > 0 ?
                        $(this).find('.quantity-chosen').val() : 1
                });
            }
        });
        if (hasDiscount) {
            prices.push({
                id: 0,
                qty: 1
            });
        }

        return sendRequest($(this), 'requests', prices);
    });


    // SUBSCRIBE FORM
    if ($('.subscribe-form').length > 0) {
        $('.subscribe-form').validate({ rules: subscribeFormRules });
        $('.subscribe-form').submit(function () {
            var $form = $(this);
            $form.find('.email').removeClass('success');
            if (!$form.valid())
                return false;
            var $btn = $form.find('[type="submit"]');
            $btn.button('loading');
            var data = $form.serializeArray();
            $.post(baseUrl + '/subscribe', data, function (res) {
                if (res.status) {
                    $form.find('.email').val('');
                    alert('You have been successfully subscribed on our updates');
                } else {
                    $form.find('.email').addClass('error').removeClass('valid');
                }
                $btn.button('reset');
            }, 'JSON');
            return false;
        });
    }

    //SHARES FUNCTIONALITY
    $('.share-entry').click(function (e) {
        e.preventDefault();
        var network = $(this).data('network');
        var action = $(this).closest('.article-shares').data('action');

        window.open($(this).prop('href'), '', 'width=600, height=350');
        $.post(action + '/' + network, function (res) { });
        return false;
    });

    // COMENTS FUNCTIONALITY
    var $comments = $('.comments');
    if ($comments.length > 0) {
        updateComments($comments);

        $comments.on('keyup change', '.comment-input', function () {
            var $charsCounter = $(this).closest('.comment-body').find('.chars-count');
            var max = $charsCounter.data('max');
            $charsCounter.text(max - $(this).val().length);
        });

        $comments.on('submit', '.comment-form', function () {
            var data = {};
            var $form = $(this);
            var $comment = $form.closest('.comment');
            var $button = $form.find('.comment-add-button');
            var $input = $form.find('.comment-input');
            $button.button('loading');
            data.content = $input.val();
            data.parent_id = 0;
            if ($form.closest('.comment:not(.comment-add)').length > 0)
                data.parent_id = $form.closest('.comment:not(.comment-add)').data('id');

            $.post($(this).prop('action'), data, function (res) {
                if (res.status == 1) {
                    $input.val('').trigger('change');
                    if ($comment.hasClass('comment-answer')) {
                        $comment.replaceWith(res.comment);
                    } else {
                        $comment.after(res.comment);
                    }

                    updateComments($comments);
                } else {
                    alert(res.msg);
                }
                $button.button('reset');
            }).error(function () {
                alert('Server error');
                $button.button('reset');
            });
            return false;
        });

        $comments.on('click', '.comment-reply', function () {
            var $comment = $(this).closest('.comment');
            var $form = $comment.find('> .media-body > .comment-add');
            if ($form.length <= 0) {
                $form = $('.comments .comment-add').first().clone();
                $form.addClass('comment-answer').css('display', 'none');
                $comment.find('> .media-body').append($form);
                updateComments($comments);
            }
            var hide = $form.is(':visible');
            $('.comment-answer').hide();
            if (!hide) {
                $form.show(0);
                if (isTwoColumns) {
                    adjustTwoColumns();
                }
                $form.hide(0);
                $form.slideDown(500, function () {
                    if (isTwoColumns) {
                        adjustTwoColumns();
                    }
                });
            }

            $('html,body').animate({
                scrollTop: $comment.offset().top
            },
                'slow');
        });

        $comments.find('.comment-icon img').on('error', function () {
            this.src = baseUrl + '/front/images/ava.png';
        });
    }

    function updateComments($comments) {
        $comments.find('.comment').removeClass('comment-last').last().addClass('comment-last');
        if (isTwoColumns) {
            adjustTwoColumns();
        }
    }


    // SUBSCRIBERS COUNTER IN THE HEADER

    $('.btn-subscribe').on('click', function () {
        var $counter = $('.subscribe-counter span');
        var count = parseInt($counter.text());
        $counter.text(++count);
        $.post(baseUrl + '/add-subscribe')
    });

});